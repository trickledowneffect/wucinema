import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { IPlaybackEngine, PlaybackEventHandler, PlaybackLaunchOptions, PlaybackState } from '../PlaybackEngine';
import { redactSensitiveText } from '../playbackPrivacy';

// Detect if we're running inside a Tauri app on Windows
// (used to decide whether to request WID embedding).
function isWindowsPlatform(): boolean {
  // Tauri v2 sets `window.__TAURI__` — additionally check the UA for 'Windows'.
  return (
    typeof window !== 'undefined' &&
    // @ts-expect-error __TAURI__ is injected by Tauri
    typeof window.__TAURI__ !== 'undefined' &&
    navigator.userAgent.includes('Windows')
  );
}

export function isEmbedSupported(): boolean {
  return isWindowsPlatform();
}

export class MpvSidecarEngine implements IPlaybackEngine {
  private state: PlaybackState = 'idle';
  private timePos = 0;
  private duration = 0;
  private volume = 100;
  private muted = false;
  private handlers = new Map<string, Set<PlaybackEventHandler>>();
  private unlistenMpvEvent?: UnlistenFn;
  private _embedMode = false;

  constructor() {
    void this.setupListeners();
  }

  public get embedMode(): boolean {
    return this._embedMode;
  }

  private async setupListeners() {
    this.unlistenMpvEvent = await listen('mpv-event', (event: { payload: unknown }) => {
      const payload = event.payload as Record<string, unknown> | undefined;
      if (!payload) return;

      const eventName = payload.event as string | undefined;

      if (eventName === 'property-change') {
        const name = payload.name as string;
        const data = payload.data;

        if (name === 'time-pos' && typeof data === 'number') {
          this.timePos = data;
          this.emit('timeupdate', { timePos: this.timePos });
        } else if (name === 'duration' && typeof data === 'number') {
          this.duration = data;
          this.emit('durationchange', { duration: this.duration });
        } else if (name === 'pause') {
          this.state = data ? 'paused' : 'playing';
          this.emit('statechange', { state: this.state });
        } else if (name === 'volume' && typeof data === 'number') {
          this.volume = data;
          this.emit('volumechange', { volume: this.volume });
        } else if (name === 'mute') {
          this.muted = Boolean(data);
          this.emit('volumechange', { muted: this.muted });
        } else if (name === 'track-list' && Array.isArray(data)) {
          this.emit('trackschange', { tracks: data });
        } else if (name === 'eof-reached' && data === true) {
          this.state = 'ended';
          this.emit('ended', { state: 'ended' });
        }
      } else if (eventName === 'end-file') {
        const reason = payload.reason as string;
        if (reason === 'eof') {
          this.state = 'ended';
          this.emit('ended', { state: 'ended' });
        } else if (reason === 'error') {
          this.state = 'error';
          this.emit('error', { error: String(payload.error ?? 'Unknown mpv error') });
        } else if (reason === 'quit') {
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

  private emit(event: string, data: unknown) {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;
    for (const handler of eventHandlers) {
      handler(event, data as Parameters<PlaybackEventHandler>[1]);
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

  public async play(url: string, options?: PlaybackLaunchOptions): Promise<void> {
    this.state = 'buffering';
    this.emit('statechange', { state: 'buffering' });

    try {
      const useBundled = localStorage.getItem('useBundledMpv') !== 'false';
      const embed = isEmbedSupported();
      this._embedMode = embed;
      const args = this.buildMpvArgs(url, options, embed);

      if (useBundled) {
        await invoke('launch_bundled_mpv_ipc', { args, embed });
      } else {
        const mpvPath = localStorage.getItem('mpvPath');
        if (!mpvPath) {
          throw new Error('No MPV path configured.');
        }
        await invoke('launch_mpv_ipc', { path: mpvPath, args, embed });
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
          console.warn('[MpvSidecarEngine] Failed to observe properties:', obsErr);
        }
      }, 800);
    } catch (e: unknown) {
      this.state = 'error';
      const message = redactSensitiveText((e as Error)?.message || String(e));
      this.emit('error', { error: message });
      throw new Error(message);
    }
  }

  private buildMpvArgs(url: string, options?: PlaybackLaunchOptions, embed = false): string[] {
    const cleanTitle = options?.title || 'Video';
    const args: string[] = [
      url,
      '--title=WU-CINE',
      `--force-media-title=${cleanTitle}`,
      '--vo=gpu-next',
      '--hwdec=auto-safe',
      '--slang=eng,en',
      '--alang=eng,en',
      '--keep-open=yes',
      '--osd-level=1',
      '--no-terminal',
      '--really-quiet',
    ];

    if (embed) {
      // In embedded mode mpv inherits the parent window — don't force its own window.
      args.push('--no-osc');     // React overlay handles controls
      args.push('--no-border');  // borderless, inside Tauri window
      // Note: --wid and --geometry are set on the Rust side using the real HWND/size.
    } else {
      // Standalone external window mode (macOS dev / fallback).
      args.push('--force-window=yes');
      args.push('--border=no');
    }

    if (options?.resumeSeconds && options.resumeSeconds > 0) {
      args.push(`--start=${Math.floor(options.resumeSeconds)}`);
    }

    if (options?.fullscreen && !embed) {
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
