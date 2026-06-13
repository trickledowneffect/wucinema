import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getResumeItems, getLatestItems } from '../services/jellyfin/jellyfinClient';
import { mapJellyfinItemToWuCinema } from '../services/jellyfin/jellyfinMappers';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';
import { getCachedItemList, cacheItemList, prefetchItems, prefetchBackdrops } from '../services/cache/cacheService';

export function useJellyfinHome() {
  const { session } = useAuth();
  const [resumeItems, setResumeItems] = useState<WuCinemaMediaItem[]>([]);
  const [latestMovies, setLatestMovies] = useState<WuCinemaMediaItem[]>([]);
  const [latestShows, setLatestShows] = useState<WuCinemaMediaItem[]>([]);
  const [heroItem, setHeroItem] = useState<WuCinemaMediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    async function fetchData() {
      setError(null);

      // 1. Serve from cache instantly
      const cachedResume = await getCachedItemList('home_resume');
      const cachedMovies = await getCachedItemList('home_latest_movies');
      const cachedShows = await getCachedItemList('home_latest_shows');

      if (cachedMovies && cachedMovies.length > 0) {
        setLatestMovies(cachedMovies);
        if (cachedResume && cachedResume.length > 0) {
          setResumeItems(cachedResume);
          setHeroItem(cachedResume[0]);
        } else {
          setHeroItem(cachedMovies[0]);
        }
        if (cachedShows) setLatestShows(cachedShows);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // 2. Fetch fresh data in parallel
      try {
        const [resumeRes, moviesRes, showsRes] = await Promise.all([
          getResumeItems(session!.activeServerUrl, session!.accessToken, session!.userId, session!.deviceId, 12),
          getLatestItems(session!.activeServerUrl, session!.accessToken, session!.userId, session!.deviceId, undefined, 16, 'Movie'),
          getLatestItems(session!.activeServerUrl, session!.accessToken, session!.userId, session!.deviceId, undefined, 16, 'Series'),
        ]);

        const mappedResume = resumeRes.Items.map(item => mapJellyfinItemToWuCinema(item, session!.activeServerUrl));
        setResumeItems(mappedResume);

        const mappedMovies = moviesRes.map(item => mapJellyfinItemToWuCinema(item, session!.activeServerUrl));
        setLatestMovies(mappedMovies);

        const mappedShows = showsRes.map(item => mapJellyfinItemToWuCinema(item, session!.activeServerUrl));
        setLatestShows(mappedShows);

        // Set hero item
        if (mappedResume.length > 0) setHeroItem(mappedResume[0]);
        else if (mappedMovies.length > 0) setHeroItem(mappedMovies[0]);

        // 3. Cache + prefetch
        void cacheItemList('home_resume', mappedResume);
        void cacheItemList('home_latest_movies', mappedMovies);
        void cacheItemList('home_latest_shows', mappedShows);
        void prefetchItems([...mappedResume, ...mappedMovies, ...mappedShows]);
        void prefetchBackdrops([...mappedResume.slice(0, 3), ...mappedMovies.slice(0, 3)]);

      } catch (err) {
        if (!cachedMovies) {
          console.error('Failed to fetch home data:', err);
          setError('Failed to load library data from server.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [session]);

  return { resumeItems, latestMovies, latestShows, heroItem, isLoading, error };
}
