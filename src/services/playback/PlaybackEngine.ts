export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

export interface PlaybackEventPayload {
  timePos?: number;
  duration?: number;
  state?: PlaybackState;
  error?: string;
  volume?: number;
  muted?: boolean;
}

export type PlaybackEventHandler = (event: string, payload: PlaybackEventPayload) => void;

export interface PlaybackLaunchOptions {
  title: string;
  resumeSeconds?: number;
  fullscreen?: boolean;
  httpHeader?: string;
  subFile?: string;
}

export interface IPlaybackEngine {
  play(url: string, options?: PlaybackLaunchOptions): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setMute(muted: boolean): Promise<void>;
  setAudioTrack(id: number | string): Promise<void>;
  destroy?(): Promise<void>;
  getAvailability?(): 'ready' | 'not-ready' | 'unavailable';
  
  on(event: string, handler: PlaybackEventHandler): void;
  off(event: string, handler: PlaybackEventHandler): void;
  
  getState(): PlaybackState;
  getTimePos(): number;
  getDuration(): number;
}
