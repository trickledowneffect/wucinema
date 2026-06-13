import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getItemDetails, getItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';

export function useJellyfinCollectionDetail(collectionId: string) {
  const { session } = useAuth();
  const [collection, setCollection] = useState<WuCinemaMediaItem | null>(null);
  const [items, setItems] = useState<WuCinemaMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !collectionId) {
      setCollection(null);
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    async function fetchCollectionDetail() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch collection detail
        const rawCollection = await getItemDetails(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          collectionId
        );
        const mappedCollection = mapJellyfinItemToWuCinema(rawCollection, session!.activeServerUrl);
        setCollection(mappedCollection);

        // 2. Fetch items inside collection
        const resItems = await getItems(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          {
            parentId: collectionId,
            recursive: true,
            fields: 'Overview,MediaSources,MediaStreams',
          }
        );
        const mappedItems = resItems.Items.map(item =>
          mapJellyfinItemToWuCinema(item, session!.activeServerUrl)
        );
        setItems(mappedItems);
      } catch (err) {
        console.error('Failed to load collection details:', err);
        setError('Failed to load collection details.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollectionDetail();
  }, [session, collectionId]);

  return { collection, items, isLoading, error };
}
