import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';

export function useJellyfinCollections() {
  const { session } = useAuth();
  const [collections, setCollections] = useState<WuCinemaMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    async function fetchCollections() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await getItems(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          {
            includeItemTypes: 'BoxSet',
            recursive: true,
            fields: 'Overview',
            limit: 50,
          }
        );
        
        const mapped = res.Items.map(item => 
          mapJellyfinItemToWuCinema(item, session!.activeServerUrl)
        );
        setCollections(mapped);
      } catch (err) {
        console.error('Failed to fetch collections:', err);
        setError('Failed to load collections.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollections();
  }, [session]);

  return { collections, isLoading, error };
}
