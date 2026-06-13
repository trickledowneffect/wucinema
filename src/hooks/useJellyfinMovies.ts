import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';
import { getCachedItemList, cacheItemList, prefetchItems } from '../services/cache/cacheService';

export function useJellyfinMovies(options?: { filters?: string; sortBy?: string; sortOrder?: 'Ascending' | 'Descending' }) {
  const { session } = useAuth();
  const [movies, setMovies] = useState<WuCinemaMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    async function fetchMovies() {
      setError(null);

      // 1. Load from cache first for instant display
      const cacheKey = `movies_${options?.filters || 'all'}_${options?.sortBy || 'DateCreated'}_${options?.sortOrder || 'Descending'}`;
      const cached = await getCachedItemList(cacheKey);
      if (cached && cached.length > 0) {
        setMovies(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // 2. Fetch fresh data in background
      try {
        const res = await getItems(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          {
            includeItemTypes: 'Movie',
            recursive: true,
            fields: 'Overview,MediaSources,MediaStreams',
            limit: 100,
            filters: options?.filters,
            sortBy: options?.sortBy || 'DateCreated',
            sortOrder: options?.sortOrder || 'Descending'
          }
        );

        const mapped = res.Items.map(item => mapJellyfinItemToWuCinema(item, session!.activeServerUrl));
        setMovies(mapped);

        // 3. Persist list + prefetch posters in background
        void cacheItemList(cacheKey, mapped);
        void prefetchItems(mapped);
      } catch (err) {
        if (!cached) {
          console.error('Failed to fetch movies:', err);
          setError('Failed to load movies.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
  }, [session, options?.filters, options?.sortBy, options?.sortOrder]);

  return { movies, isLoading, error };
}
