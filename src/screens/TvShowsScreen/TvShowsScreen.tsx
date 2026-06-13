import { useState } from 'react';
import PosterCard from '../../components/PosterCard/PosterCard';
import { SortBold, AltArrowDownBold } from 'solar-icon-set';
import { useJellyfinShows } from '../../hooks/useJellyfinShows';
import './TvShowsScreen.css';

type SortOption = { label: string; sortBy: string; sortOrder: 'Ascending' | 'Descending' };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Name (A–Z)',       sortBy: 'SortName',    sortOrder: 'Ascending'  },
  { label: 'Name (Z–A)',       sortBy: 'SortName',    sortOrder: 'Descending' },
  { label: 'Recently Added',   sortBy: 'DateCreated', sortOrder: 'Descending' },
  { label: 'Year (Newest)',    sortBy: 'ProductionYear', sortOrder: 'Descending' },
  { label: 'Year (Oldest)',    sortBy: 'ProductionYear', sortOrder: 'Ascending'  },
  { label: 'Rating (High)',    sortBy: 'CommunityRating', sortOrder: 'Descending' },
];

export default function TvShowsScreen() {
  const [sortIdx, setSortIdx] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeSort = SORT_OPTIONS[sortIdx];
  const { shows, isLoading, error } = useJellyfinShows({
    sortBy: activeSort.sortBy,
    sortOrder: activeSort.sortOrder,
  });

  return (
    <div className="tv-shows-screen">
      <div className="tv-shows-header">
        <div className="tv-shows-header-left">
          <h1 className="tv-shows-title">TV Shows</h1>
          {!isLoading && (
            <span className="tv-shows-count">{shows.length} series</span>
          )}
        </div>

        <div className="tv-shows-controls">
          {/* Sort dropdown */}
          <div className="tv-shows-sort-wrap">
            <button
              className="tv-shows-sort-btn"
              aria-label="Sort shows"
              aria-expanded={showSortMenu}
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <SortBold size={14} />
              <span>{activeSort.label}</span>
              <AltArrowDownBold size={12} className={`tv-sort-chevron ${showSortMenu ? 'tv-sort-chevron--open' : ''}`} />
            </button>

            {showSortMenu && (
              <>
                {/* Backdrop to close on outside click */}
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
        </div>
      </div>

      {isLoading && !shows.length ? (
        <div className="tv-shows-loading">
          <div className="app-loading-spinner" />
        </div>
      ) : error ? (
        <div className="tv-shows-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="tv-shows-grid">
          {shows.map((show) => (
            <PosterCard
              key={show.id}
              id={show.id}
              title={show.name}
              type={show.type}
              year={show.year}
              imageUrl={show.primaryImageUrl}
              is4K={show.is4K}
              isHDR={show.isHDR}
              isWatched={show.isWatched}
              progress={show.playedPercentage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
