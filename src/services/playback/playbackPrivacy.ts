import type { WuCinemaMediaItem } from '../jellyfin/jellyfinTypes';

const URL_PATTERN = /https?:\/\/[^\s"'`<>()]+/gi;
const TOKEN_PATTERN = /(api[_-]?key|access[_-]?token|token)=([^&\s"'`]+)/gi;
const AUTH_PATTERN = /Authorization:\s*[^\s"'`]+(?:\s+[^\s"'`]+)*/gi;
const PATH_PATTERN = /(?:[A-Za-z]:\\|\/)(?!\/)[^\s"'`]+/g;

function redactText(value: string): string {
  return value
    .replace(AUTH_PATTERN, 'Authorization: [REDACTED]')
    .replace(TOKEN_PATTERN, (_match, key) => `${key}=[REDACTED_TOKEN]`)
    .replace(URL_PATTERN, (match) => {
      if (match.toLowerCase().includes('/videos/') || match.toLowerCase().includes('stream')) {
        return '[REDACTED_STREAM_URL]';
      }

      return '[REDACTED_URL]';
    })
    .replace(PATH_PATTERN, '[REDACTED_PATH]');
}

export function sanitizePlaybackError(error: unknown): string {
  if (error instanceof Error) {
    return redactText(error.message || error.name || 'Playback error');
  }

  if (typeof error === 'string') {
    return redactText(error);
  }

  try {
    return redactText(JSON.stringify(error));
  } catch {
    return 'Playback error';
  }
}

export function sanitizeUrlForDisplay(url?: string | null): string {
  if (!url) return 'Unknown';

  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return redactText(url);
  }
}

export function safeMediaDisplayName(item?: Pick<WuCinemaMediaItem, 'name' | 'seriesName' | 'year' | 'episodeNumber' | 'seasonNumber'> | null): string {
  if (!item) return 'Unknown title';

  if (item.seriesName && typeof item.seasonNumber === 'number' && typeof item.episodeNumber === 'number') {
    return `${item.seriesName} · S${String(item.seasonNumber).padStart(2, '0')}E${String(item.episodeNumber).padStart(2, '0')}`;
  }

  return item.name || 'Unknown title';
}

export function redactSensitiveText(value: string): string {
  return redactText(value);
}
