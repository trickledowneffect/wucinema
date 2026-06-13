import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';

export function useJellyfinSearch(query: string) {
  const { session } = useAuth();
  const [results, setResults] = useState<WuCinemaMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getItems(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          {
            searchTerm: query,
            recursive: true,
            includeItemTypes: 'Movie,Series',
            limit: 20,
            fields: 'Overview'
          }
        );
        
        const mapped = res.Items.map(item => mapJellyfinItemToWuCinema(item, session!.activeServerUrl));
        setResults(mapped);
      } catch (err) {
        console.error('Failed to search:', err);
        setError('Failed to load search results.');
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [session, query]);

  return { results, isLoading, error };
}
