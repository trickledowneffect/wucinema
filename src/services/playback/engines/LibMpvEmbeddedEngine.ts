import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { IPlaybackEngine, PlaybackEventHandler, PlaybackLaunchOptions, PlaybackState } from '../PlaybackEngine';
import { redactSensitiveText } from '../playbackPrivacy';

export class LibMpvEmbeddedEngine implements IPlaybackEngine {
  private state: PlaybackState = 'idle';
  private timePos = 0;
  private duration = 0;
  private volume = 100;
  private muted = false;
  private handlers = new Map<string, Set<PlaybackEventHandler>>();
  private unlistenMpvEvent?: UnlistenFn;
  private ready = true;

  constructor() {
    void this.setupListeners();
  }

  private async setupListeners() {
    this.unlistenMpvEvent = await listen('mpv-event', (event: any) => {
      const payload = event.payload as any;
      if (!payload) return;

      const eventName = payload.event;

      if (eventName === 'property-change') {
        if (payload.name === 'time-pos' && typeof payload.data === 'number') {
          this.timePos = payload.data;
          this.emit('timeupdate', { timePos: this.timePos });
        } else if (payload.name === 'duration' && typeof payload.data === 'number') {
          this.duration = payload.data;
          this.emit('durationchange', { duration: this.duration });
        } else if (payload.name === 'pause') {
          this.state = payload.data ? 'paused' : 'playing';
          this.emit('statechange', { state: this.state });
        } else if (payload.name === 'volume') {
          this.volume = payload.data;
          this.emit('volumechange', { volume: this.volume });
        } else if (payload.name === 'mute') {
          this.muted = payload.data;
          this.emit('volumechange', { muted: this.muted });
        } else if (payload.name === 'track-list' && Array.isArray(payload.data)) {
          this.emit('trackschange', { tracks: payload.data });
        } else if (payload.name === 'eof-reached' && payload.data === true) {
          this.state = 'ended';
          this.emit('ended', { state: 'ended' });
        }
      } else if (eventName === 'end-file') {
        if (payload.reason === 'eof') {
          this.state = 'ended';
          this.emit('ended', { state: 'ended' });
        } else if (payload.reason === 'error') {
          this.state = 'error';
          this.emit('error', { error: payload.error || 'Unknown mpv error' });
        } else if (payload.reason === 'quit') {
          this.state = 'idle';
          this.emit('stopped', { state: 'idle' });
        }
      }
    });
  }

  public async destroy() {
    if (this.unlistenMpvEvent) {
      this.unlistenMpvEvent();
    }
    this.handlers.clear();
  }

  private emit(event: string, data: any) {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    for (const handler of eventHandlers) {
      handler(event, data);
    }
  }

  public on(event: string, handler: PlaybackEventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  public off(event: string, handler: PlaybackEventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  public getState() { return this.state; }
  public getTimePos() { return this.timePos; }
  public getDuration() { return this.duration; }

  public getAvailability() {
    return this.ready ? 'ready' : 'not-ready';
  }

  public async play(url: string, options?: PlaybackLaunchOptions): Promise<void> {
    this.state = 'buffering';
    this.emit('statechange', { state: 'buffering' });

    try {
      const useBundled = localStorage.getItem('useBundledMpv') !== 'false';
      const args = this.buildMpvArgs(url, options);

      if (useBundled) {
        await invoke('launch_bundled_mpv_ipc', { args, embed: true });
      } else {
        const mpvPath = localStorage.getItem('mpvPath');
        if (!mpvPath) {
          throw new Error('No MPV path configured.');
        }
        await invoke('launch_mpv_ipc', { path: mpvPath, args, embed: true });
      }

      // Wait a moment for IPC connection, then observe properties
      setTimeout(async () => {
        try {
          await invoke('mpv_command', { command: ['observe_property', 1, 'time-pos'] });
          await invoke('mpv_command', { command: ['observe_property', 2, 'duration'] });
          await invoke('mpv_command', { command: ['observe_property', 3, 'pause'] });
          await invoke('mpv_command', { command: ['observe_property', 4, 'volume'] });
          await invoke('mpv_command', { command: ['observe_property', 5, 'mute'] });
          await invoke('mpv_command', { command: ['observe_property', 6, 'track-list'] });
        } catch (obsErr) {
          console.warn('[LibMpvEmbeddedEngine] Failed to observe properties:', obsErr);
        }
      }, 800);
    } catch (e: any) {
      this.state = 'error';
      const message = redactSensitiveText(e?.message || String(e));
      this.emit('error', { error: message });
      throw new Error(message);
    }
  }

  private buildMpvArgs(url: string, options?: PlaybackLaunchOptions): string[] {
    const cleanTitle = options?.title || 'Video';
    const args: string[] = [
      url,
      '--title=WU-CINE',
      `--force-media-title=${cleanTitle}`,
      '--vo=gpu-next',
      '--hwdec=auto-safe',
      '--force-window=yes',
      '--border=no',
      '--slang=eng,en',
      '--alang=eng,en',
      '--keep-open=yes',
      '--osd-level=1',
      '--no-terminal',
      '--really-quiet',
      // Embedded controls overrides
      '--no-osc',
      '--no-input-default-bindings',
      '--window-dragging=no',
    ];

    if (options?.resumeSeconds && options.resumeSeconds > 0) {
      args.push(`--start=${Math.floor(options.resumeSeconds)}`);
    }

    if (options?.fullscreen) {
      args.push('--fs');
    }

    if (options?.httpHeader) {
      args.push(`--http-header-fields=${options.httpHeader}`);
    }

    if (options?.subFile) {
      args.push(`--sub-file=${options.subFile}`);
    }

    return args;
  }

  public async pause(): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'pause', true] });
  }

  public async resume(): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'pause', false] });
  }

  public async stop(): Promise<void> {
    try {
      await invoke('mpv_command', { command: ['quit'] });
    } catch {
      // ignore
    }
    this.state = 'idle';
    this.emit('stopped', { state: 'idle' });
  }

  public async seekTo(seconds: number): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'time-pos', seconds] });
  }

  public async setVolume(volume: number): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'volume', volume] });
  }

  public async setMute(muted: boolean): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'mute', muted] });
  }

  public async setAudioTrack(id: number | string): Promise<void> {
    await invoke('mpv_command', { command: ['set_property', 'audio', id] });
  }
}
