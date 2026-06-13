import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItemDetails } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';
import { getCachedItemMetadata, cacheItemMetadata, cachePosterImage, cacheBackdropImage } from '../services/cache/cacheService';

export function useJellyfinDetail(itemId: string) {
  const { session } = useAuth();
  const [item, setItem] = useState<WuCinemaMediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !itemId) {
      setItem(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    async function fetchDetail() {
      setError(null);

      // 1. Load from cache first — instant display
      const cached = await getCachedItemMetadata(itemId);
      if (cached) {
        setItem(cached);
        setIsLoading(false); // Show immediately from cache
      } else {
        setIsLoading(true);
      }

      // 2. Always fetch fresh data in the background to stay up-to-date
      try {
        const rawItem = await getItemDetails(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          itemId
        );
        
        const mapped = mapJellyfinItemToWuCinema(rawItem, session!.activeServerUrl);
        setItem(mapped);

        // 3. Write fresh data back to cache (fire-and-forget)
        void cacheItemMetadata(mapped);
        void cachePosterImage(mapped.id, mapped.primaryImageUrl);
        void cacheBackdropImage(mapped.id, mapped.backdropImageUrl);
      } catch (err) {
        // If network fails but we have cache, don't show an error
        if (!cached) {
          console.error('Failed to fetch item details:', err);
          setError('Failed to load details.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [session, itemId]);

  return { item, isLoading, error };
}
