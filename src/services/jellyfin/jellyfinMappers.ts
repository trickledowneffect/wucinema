import type { JellyfinItem, WuCinemaMediaItem, CastMember } from './jellyfinTypes';
import { normalizeServerUrl } from './jellyfinClient';

/**
 * Build a Jellyfin image URL.
 */
export function getImageUrl(
  serverUrl: string,
  itemId: string,
  imageType: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb',
  imageTag?: string,
  options?: { maxWidth?: number; maxHeight?: number; fillHeight?: number; fillWidth?: number; quality?: number }
): string | undefined {
  if (!imageTag && imageType !== 'Backdrop') return undefined; // Backdrop sometimes lacks tags but still works, others need tags

  const normalized = normalizeServerUrl(serverUrl);
  let url = `${normalized}/Items/${itemId}/Images/${imageType}`;
  
  const params = new URLSearchParams();
  if (imageTag) params.append('tag', imageTag);
  if (options?.maxWidth) params.append('maxWidth', options.maxWidth.toString());
  if (options?.maxHeight) params.append('maxHeight', options.maxHeight.toString());
  if (options?.fillHeight) params.append('fillHeight', options.fillHeight.toString());
  if (options?.fillWidth) params.append('fillWidth', options.fillWidth.toString());
  if (options?.quality) params.append('quality', options.quality.toString());

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return url;
}

/**
 * Map a raw JellyfinItem from the API into our clean WuCinemaMediaItem UI format.
 */
export function mapJellyfinItemToWuCinema(
  item: JellyfinItem,
  serverUrl: string
): WuCinemaMediaItem {
  
  // 1. Image URLs
  const primaryImageUrl = getImageUrl(serverUrl, item.Id, 'Primary', item.ImageTags?.Primary, { maxWidth: 600 });
  
  // Backdrops can be in BackdropImageTags array or ImageTags.Backdrop
  const backdropTag = item.BackdropImageTags?.[0] || item.ImageTags?.Backdrop;
  const backdropImageUrl = getImageUrl(serverUrl, item.Id, 'Backdrop', backdropTag, { maxWidth: 1920 });
  
  const logoImageUrl = getImageUrl(serverUrl, item.Id, 'Logo', item.ImageTags?.Logo, { maxWidth: 400 });

  // 2. Runtime (Ticks to minutes. 1 tick = 10,000 milliseconds)
  const runtimeMinutes = item.RunTimeTicks 
    ? Math.round(item.RunTimeTicks / 10000 / 1000 / 60) 
    : 0;

  // 3. User Data (Watched state, progress)
  const isWatched = item.UserData?.Played || false;
  const resumePositionTicks = item.UserData?.PlaybackPositionTicks || 0;
  
  let playedPercentage = 0;
  if (resumePositionTicks > 0 && item.RunTimeTicks && item.RunTimeTicks > 0) {
    playedPercentage = (resumePositionTicks / item.RunTimeTicks) * 100;
  }
  // If watched, it's 100%
  if (isWatched) playedPercentage = 100;

  // 4. Media Streams (Detect 4K, 1080p, 720p, HDR, Codecs)
  let is4K = false;
  let is1080p = false;
  let is720p = false;
  let isHDR = false;
  let videoCodec = undefined;
  let audioCodec = undefined;

  if (item.MediaSources && item.MediaSources.length > 0) {
    if (item.MediaStreams) {
      const videoStream = item.MediaStreams.find(s => s.Type === 'Video');
      const audioStream = item.MediaStreams.find(s => s.Type === 'Audio');

      if (videoStream) {
        videoCodec = videoStream.Codec?.toUpperCase();
        
        // Resolution detection based on width
        if (videoStream.Width) {
          if (videoStream.Width >= 3800) {
            is4K = true;
          } else if (videoStream.Width >= 1900) {
            is1080p = true;
          } else if (videoStream.Width >= 1200) {
            is720p = true;
          }
        }
        
        if (videoStream.VideoRange && videoStream.VideoRange.toUpperCase() === 'HDR') {
          isHDR = true;
        }
      }

      if (audioStream) {
        audioCodec = audioStream.Codec?.toUpperCase();
      }
    }
  }

  // 5. Cast — map People, actors only, up to 12, with real photo URLs
  const cast: CastMember[] = (item.People || [])
    .filter((p) => p.Type === 'Actor' || !p.Type)
    .slice(0, 12)
    .map((p) => ({
      id: p.Id,
      name: p.Name,
      role: p.Role,
      type: p.Type,
      // Jellyfin person images: /Items/{personId}/Images/Primary?tag={imageTag}
      imageUrl: p.PrimaryImageTag
        ? `${normalizeServerUrl(serverUrl)}/Items/${p.Id}/Images/Primary?tag=${p.PrimaryImageTag}&maxWidth=200&quality=85`
        : undefined,
    }));

  return {
    id: item.Id,
    name: item.Name,
    originalTitle: item.OriginalTitle,
    type: item.Type,
    year: item.ProductionYear,
    overview: item.Overview,
    runtimeMinutes,
    communityRating: item.CommunityRating,
    officialRating: item.OfficialRating,
    genres: item.Genres || [],
    
    primaryImageUrl,
    backdropImageUrl,
    logoImageUrl,

    cast,

    seriesName: item.SeriesName,
    seriesId: item.SeriesId,
    seasonId: item.SeasonId,
    seasonNumber: item.ParentIndexNumber,
    episodeNumber: item.IndexNumber,
    
    isWatched,
    playedPercentage,
    resumePositionTicks,
    unplayedCount: item.UserData?.UnplayedItemCount,
    
    is4K,
    is1080p,
    is720p,
    isHDR,
    videoCodec,
    audioCodec,
  };
}
