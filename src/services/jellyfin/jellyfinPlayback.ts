import { redactSensitiveText } from '../playback/playbackPrivacy';

export interface PlaybackStartPayload {
  ItemId: string;
  MediaSourceId?: string;
  PlaySessionId?: string;
  CanSeek: boolean;
  PositionTicks: number;
}

export interface PlaybackStopPayload {
  ItemId: string;
  MediaSourceId?: string;
  PlaySessionId?: string;
  PositionTicks: number;
}

/**
 * Report playback start to Jellyfin.
 */
export async function reportPlaybackStart(
  serverUrl: string, 
  accessToken: string, 
  _userId: string, 
  payload: PlaybackStartPayload
): Promise<void> {
  const url = `${serverUrl}/Sessions/Playing`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `MediaBrowser Token="${accessToken}"`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to report playback start to Jellyfin', redactSensitiveText(String(error)));
  }
}

/**
 * Report playback stopped to Jellyfin.
 */
export async function reportPlaybackStopped(
  serverUrl: string, 
  accessToken: string, 
  _userId: string, 
  payload: PlaybackStopPayload
): Promise<void> {
  const url = `${serverUrl}/Sessions/Playing/Stopped`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `MediaBrowser Token="${accessToken}"`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to report playback stopped to Jellyfin', redactSensitiveText(String(error)));
  }
}

export interface PlaybackProgressPayload {
  ItemId: string;
  MediaSourceId?: string;
  PlaySessionId?: string;
  PositionTicks: number;
  IsPaused: boolean;
  IsMuted: boolean;
  VolumeLevel?: number;
}

/**
 * Report playback progress to Jellyfin.
 */
export async function reportPlaybackProgress(
  serverUrl: string, 
  accessToken: string, 
  _userId: string, 
  payload: PlaybackProgressPayload
): Promise<void> {
  const url = `${serverUrl}/Sessions/Playing/Progress`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `MediaBrowser Token="${accessToken}"`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to report playback progress to Jellyfin', redactSensitiveText(String(error)));
  }
}

/**
 * Generates the stream URL for an item.
 * For movies, we just hit /Videos/{ItemId}/stream
 */
export function getPlaybackStreamUrl(
  serverUrl: string,
  itemId: string,
  mediaSourceId?: string,
  preferDirectPlay: boolean = true,
  avoidTranscoding: boolean = true
): string {
  let url = `${serverUrl}/Videos/${itemId}/stream`;
  
  const params = new URLSearchParams();
  
  if (mediaSourceId) {
    params.append('mediaSourceId', mediaSourceId);
  }

  if (preferDirectPlay || avoidTranscoding) {
    params.append('static', 'true');
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}
