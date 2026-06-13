export type PreferredPlayer = 'integrated' | 'external';
export type PlaybackAvailability = 'ready' | 'not-ready' | 'unavailable';

export interface PlaybackSettings {
  preferredPlayer: PreferredPlayer;
  useExternalFallbackWhenUnavailable: boolean;
  avoidTranscoding: boolean;
  preferDirectPlay: boolean;
  mpvPath: string;
}

const DEFAULT_SETTINGS: PlaybackSettings = {
  preferredPlayer: 'integrated',
  useExternalFallbackWhenUnavailable: false,
  avoidTranscoding: true,
  preferDirectPlay: true,
  mpvPath: '',
};

function readBoolean(key: string, fallback: boolean): boolean {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

export function getPlaybackSettings(): PlaybackSettings {
  return {
    preferredPlayer: (localStorage.getItem('preferredPlayer') as PreferredPlayer) || DEFAULT_SETTINGS.preferredPlayer,
    useExternalFallbackWhenUnavailable: readBoolean(
      'useExternalFallbackWhenUnavailable',
      DEFAULT_SETTINGS.useExternalFallbackWhenUnavailable,
    ),
    avoidTranscoding: readBoolean('avoidTranscoding', DEFAULT_SETTINGS.avoidTranscoding),
    preferDirectPlay: readBoolean('preferDirectPlay', DEFAULT_SETTINGS.preferDirectPlay),
    mpvPath: localStorage.getItem('mpvPath') || DEFAULT_SETTINGS.mpvPath,
  };
}

export function setPlaybackSetting<K extends keyof PlaybackSettings>(key: K, value: PlaybackSettings[K]): void {
  if (typeof value === 'boolean') {
    localStorage.setItem(key, value ? 'true' : 'false');
    return;
  }

  localStorage.setItem(key, String(value));
}
