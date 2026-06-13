import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSeasons, getEpisodes } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';

export function useJellyfinShowDetails(showId: string) {
  const { session } = useAuth();
  const [seasons, setSeasons] = useState<WuCinemaMediaItem[]>([]);
  const [episodes, setEpisodes] = useState<WuCinemaMediaItem[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch seasons
  useEffect(() => {
    if (!session || !showId) {
      setSeasons([]);
      setActiveSeasonId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    async function fetchSeasons() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getSeasons(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          showId
        );
        
        const mappedSeasons = response.Items.map(item => 
          mapJellyfinItemToWuCinema(item, session!.activeServerUrl)
        ).sort((a, b) => {
          // Sort by season number
          const numA = a.seasonNumber ?? 0;
          const numB = b.seasonNumber ?? 0;
          return numA - numB;
        });

        setSeasons(mappedSeasons);
        
        // Select first season by default
        if (mappedSeasons.length > 0) {
          setActiveSeasonId(mappedSeasons[0].id);
        } else {
          setActiveSeasonId(null);
        }
      } catch (err) {
        console.error('Failed to fetch seasons:', err);
        setError('Failed to load show seasons.');
        setIsLoading(false);
      }
    }

    fetchSeasons();
  }, [session, showId]);

  // 2. Fetch episodes when activeSeasonId changes
  useEffect(() => {
    if (!session || !showId || !activeSeasonId) {
      setEpisodes([]);
      return;
    }

    async function fetchEpisodes() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getEpisodes(
          session!.activeServerUrl,
          session!.accessToken,
          session!.userId,
          session!.deviceId,
          showId,
          { seasonId: activeSeasonId || undefined }
        );
        
        const mappedEpisodes = response.Items.map(item => 
          mapJellyfinItemToWuCinema(item, session!.activeServerUrl)
        ).sort((a, b) => {
          // Sort by episode number
          const numA = a.episodeNumber ?? 0;
          const numB = b.episodeNumber ?? 0;
          return numA - numB;
        });

        setEpisodes(mappedEpisodes);
      } catch (err) {
        console.error('Failed to fetch episodes:', err);
        setError('Failed to load show episodes.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEpisodes();
  }, [session, showId, activeSeasonId]);

  return {
    seasons,
    episodes,
    activeSeasonId,
    setActiveSeasonId,
    isLoading,
    error,
  };
}
