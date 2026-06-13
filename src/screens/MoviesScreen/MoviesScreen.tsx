import { useState } from 'react';
import PosterCard from '../../components/PosterCard/PosterCard';
import { SortBold, FilterBold, DisplayBold, MonitorBold, AltArrowDownBold } from 'solar-icon-set';
import { useJellyfinMovies } from '../../hooks/useJellyfinMovies';
import SpotlightMoviesScreen from '../../components/SpotlightMoviesScreen/SpotlightMoviesScreen';
import './MoviesScreen.css';
import '../TvShowsScreen/TvShowsScreen.css'; // For tv-sort-* styles

type SortOption = { label: string; sortBy: string; sortOrder: 'Ascending' | 'Descending' };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Name (A–Z)',       sortBy: 'SortName',    sortOrder: 'Ascending'  },
  { label: 'Name (Z–A)',       sortBy: 'SortName',    sortOrder: 'Descending' },
  { label: 'Recently Added',   sortBy: 'DateCreated', sortOrder: 'Descending' },
  { label: 'Year (Newest)',    sortBy: 'ProductionYear', sortOrder: 'Descending' },
  { label: 'Year (Oldest)',    sortBy: 'ProductionYear', sortOrder: 'Ascending'  },
  { label: 'Rating (High)',    sortBy: 'CommunityRating', sortOrder: 'Descending' },
];

export default function MoviesScreen() {
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('shelf');
  const [sortIdx, setSortIdx] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeSort = SORT_OPTIONS[sortIdx];
  const { movies, isLoading, error } = useJellyfinMovies({
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  });

  if (isLoading && movies.length === 0) {
    return (
      <div className="movies-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="movies-screen" style={{ padding: 'var(--space-8)' }}>
        <h2>Error Loading Movies</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }
  const ViewToggle = ({ inGrid = false }) => (
    <div className={`movies-view-toggle ${inGrid ? 'in-grid' : ''}`}>
      <button 
        className={`movies-view-btn ${viewMode === 'shelf' ? 'active' : ''}`}
        onClick={() => setViewMode('shelf')}
        title="Spotlight Shelf"
      >
        <MonitorBold size={18} />
      </button>
      <button 
        className={`movies-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
        title="Poster Grid"
      >
        <DisplayBold size={18} />
      </button>
    </div>
  );

  if (viewMode === 'shelf') {
    return (
      <div className="movies-screen-container">
        <ViewToggle />
        <SpotlightMoviesScreen movies={movies} isLoading={isLoading} error={error} />
      </div>
    );
  }

  return (
    <div className="movies-screen-container">
      <ViewToggle inGrid />
      <div className="movies-screen">
      <div className="movies-header">
        <h1 className="movies-title">Movies</h1>
        <div className="movies-controls">
          <span className="movies-count">{movies.length} movies</span>
          
          <div className="tv-shows-sort-wrap">
            <button
              className="movies-sort-btn tv-shows-sort-btn"
              aria-label="Sort movies"
              aria-expanded={showSortMenu}
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <SortBold size={14} />
              <span>{activeSort.label}</span>
              <AltArrowDownBold size={12} className={`tv-sort-chevron ${showSortMenu ? 'tv-sort-chevron--open' : ''}`} />
            </button>

            {showSortMenu && (
              <>
                <div className="tv-sort-backdrop" onClick={() => setShowSortMenu(false)} />
                <div className="tv-sort-menu" role="listbox" aria-label="Sort options">
                  {SORT_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.label}
                      className={`tv-sort-option ${idx === sortIdx ? 'tv-sort-option--active' : ''}`}
                      role="option"
                      aria-selected={idx === sortIdx}
                      onClick={() => {
                        setSortIdx(idx);
                        setShowSortMenu(false);
                      }}
                    >
                      {opt.label}
                      {idx === sortIdx && <span className="tv-sort-check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="movies-sort-btn" aria-label="Filter movies">
            <FilterBold size={14} /> Filter
          </button>
        </div>
      </div>
      <div className="movies-grid">
        {movies.map((movie) => (
          <PosterCard
            key={movie.id}
            id={movie.id}
            title={movie.name}
            type={movie.type}
            year={movie.year}
            imageUrl={movie.primaryImageUrl}
            is4K={movie.is4K}
            isHDR={movie.isHDR}
            isWatched={movie.isWatched}
            progress={movie.playedPercentage}
          />
        ))}
      </div>
      </div>
    </div>
  );
}
