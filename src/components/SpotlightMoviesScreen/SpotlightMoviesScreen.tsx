import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotlightHero from '../SpotlightHero/SpotlightHero';
import PosterShelf from '../PosterShelf/PosterShelf';
import { usePlayback } from '../../hooks/usePlayback';
import type { WuCinemaMediaItem } from '../../services/jellyfin/jellyfinTypes';
import './SpotlightMoviesScreen.css';

interface SpotlightMoviesScreenProps {
  movies: WuCinemaMediaItem[];
  isLoading: boolean;
  error: string | null;
}

export default function SpotlightMoviesScreen({ movies, isLoading, error }: SpotlightMoviesScreenProps) {
  const navigate = useNavigate();
  const { startPlayback } = usePlayback();

  // Pick a random starting index once when movies load
  const initialIndex = useMemo(() => {
    if (movies.length === 0) return 0;
    return Math.floor(Math.random() * movies.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movies.length > 0]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Keep index in sync if movies array grows (e.g. cache → live)
  useEffect(() => {
    if (movies.length > 0 && selectedIndex >= movies.length) {
      setSelectedIndex(Math.floor(Math.random() * movies.length));
    }
  }, [movies.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (movies.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % movies.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + movies.length) % movies.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigate(`/movie/${movies[selectedIndex].id}`);
    }
  }, [movies, selectedIndex, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading && movies.length === 0) {
    return (
      <div className="spotlight-screen-center">
        <div className="app-loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || movies.length === 0) {
    return (
      <div className="spotlight-screen-center">
        <h2>{error || "No movies found."}</h2>
      </div>
    );
  }

  const selectedMovie = movies[selectedIndex] || movies[0];

  return (
    <div className="spotlight-screen">
      <SpotlightHero
        movie={selectedMovie}
        // Play immediately — no going to detail first
        onPlay={() => startPlayback(selectedMovie, false)}
        onResume={() => startPlayback(selectedMovie, true)}
        onDetails={() => navigate(`/movie/${selectedMovie.id}`)}
        onCache={() => alert('Caching coming in Phase 5')}
        onSubtitles={() => alert('Subtitles coming in Phase 6')}
      />
      
      <PosterShelf
        movies={movies}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onActivate={() => navigate(`/movie/${selectedMovie.id}`)}
      />
    </div>
  );
}
