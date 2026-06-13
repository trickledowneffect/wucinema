import { useState, useMemo, useEffect } from 'react';
import PosterCard from '../../components/PosterCard/PosterCard';
import { MagniferBold } from 'solar-icon-set';
import { useJellyfinSearch } from '../../hooks/useJellyfinSearch';
import './SearchScreen.css';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'movies' | 'shows'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const { results, isLoading, error } = useJellyfinSearch(query);

  // Reset filters when query changes
  useEffect(() => {
    setSelectedType('all');
    setSelectedGenre('all');
    setSelectedYear('all');
  }, [query]);

  // Extract unique genres dynamically from the search results
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    results.forEach((item) => {
      if (item.genres) {
        item.genres.forEach((g) => genres.add(g));
      }
    });
    return Array.from(genres).slice(0, 8);
  }, [results]);

  // Filter search results in real-time
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // 1. Type Filter
      if (selectedType !== 'all') {
        const isMovie = item.type === 'Movie';
        if (selectedType === 'movies' && !isMovie) return false;
        if (selectedType === 'shows' && isMovie) return false;
      }

      // 2. Genre Filter
      if (selectedGenre !== 'all') {
        if (!item.genres || !item.genres.includes(selectedGenre)) return false;
      }

      // 3. Year Filter
      if (selectedYear !== 'all') {
        const y = item.year;
        if (!y) return false;
        if (selectedYear === '2026' && y !== 2026) return false;
        if (selectedYear === '2025' && y !== 2025) return false;
        if (selectedYear === '2020s' && (y < 2020 || y > 2029)) return false;
        if (selectedYear === '2010s' && (y < 2010 || y > 2019)) return false;
        if (selectedYear === 'older' && y >= 2010) return false;
      }

      return true;
    });
  }, [results, selectedType, selectedGenre, selectedYear]);

  const filteredMovies = filteredResults.filter((item) => item.type === 'Movie');
  const filteredShows = filteredResults.filter((item) => item.type === 'Series');
  
  const hasResults = filteredResults.length > 0;

  return (
    <div className="search-screen">
      <div className="search-screen-input-wrapper">
        <MagniferBold className="search-screen-icon" size={22} color="currentColor" />
        <input
          className="search-screen-input"
          type="text"
          placeholder="Search your library (Press Ctrl+K / Cmd+K anywhere)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search your media library"
        />
      </div>

      {/* Filter Row */}
      {query && results.length > 0 && (
        <div className="search-filters fade-in">
          {/* Type Filter */}
          <div className="filter-group">
            <span className="filter-group-label">Type</span>
            <button
              className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              All
            </button>
            <button
              className={`filter-chip ${selectedType === 'movies' ? 'active' : ''}`}
              onClick={() => setSelectedType('movies')}
            >
              Movies
            </button>
            <button
              className={`filter-chip ${selectedType === 'shows' ? 'active' : ''}`}
              onClick={() => setSelectedType('shows')}
            >
              TV Shows
            </button>
          </div>

          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-label">Genre</span>
              <button
                className={`filter-chip ${selectedGenre === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedGenre('all')}
              >
                All
              </button>
              {availableGenres.map((g) => (
                <button
                  key={g}
                  className={`filter-chip ${selectedGenre === g ? 'active' : ''}`}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Year Filter */}
          <div className="filter-group">
            <span className="filter-group-label">Year</span>
            <button
              className={`filter-chip ${selectedYear === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedYear('all')}
            >
              All
            </button>
            <button
              className={`filter-chip ${selectedYear === '2026' ? 'active' : ''}`}
              onClick={() => setSelectedYear('2026')}
            >
              2026
            </button>
            <button
              className={`filter-chip ${selectedYear === '2025' ? 'active' : ''}`}
              onClick={() => setSelectedYear('2025')}
            >
              2025
            </button>
            <button
              className={`filter-chip ${selectedYear === '2020s' ? 'active' : ''}`}
              onClick={() => setSelectedYear('2020s')}
            >
              2020s
            </button>
            <button
              className={`filter-chip ${selectedYear === '2010s' ? 'active' : ''}`}
              onClick={() => setSelectedYear('2010s')}
            >
              2010s
            </button>
            <button
              className={`filter-chip ${selectedYear === 'older' ? 'active' : ''}`}
              onClick={() => setSelectedYear('older')}
            >
              Older
            </button>
          </div>
        </div>
      )}

      {!query && (
        <div className="search-screen-empty">
          <MagniferBold className="search-screen-empty-icon" size={64} color="currentColor" />
          <div className="search-screen-empty-text">Search your library</div>
          <div className="search-screen-empty-hint">
            Start typing to find movies, TV shows, and collections (or press Ctrl+K / Cmd+K)
          </div>
        </div>
      )}

      {isLoading && query && (
        <div className="search-screen-empty">
          <div className="app-loading-spinner search-screen-empty-icon" style={{ width: 40, height: 40 }} />
          <div className="search-screen-empty-text">Searching...</div>
        </div>
      )}

      {error && query && !isLoading && (
        <div className="search-screen-empty">
          <div className="search-screen-empty-text">Error</div>
          <div className="search-screen-empty-hint">{error}</div>
        </div>
      )}

      {query && !hasResults && !isLoading && !error && (
        <div className="search-screen-empty">
          <div className="search-screen-empty-text">No results found</div>
          <div className="search-screen-empty-hint">
            Try a different search term or reset filters
          </div>
        </div>
      )}

      {filteredMovies.length > 0 && (
        <div className="search-section">
          <h2 className="search-section-title">Movies</h2>
          <div className="search-results-grid">
            {filteredMovies.map((movie) => (
              <PosterCard
                key={movie.id}
                id={movie.id}
                title={movie.name}
                type={movie.type}
                year={movie.year}
                imageUrl={movie.primaryImageUrl}
                is4K={movie.is4K}
                isHDR={movie.isHDR}
              />
            ))}
          </div>
        </div>
      )}

      {filteredShows.length > 0 && (
        <div className="search-section">
          <h2 className="search-section-title">TV Shows</h2>
          <div className="search-results-grid">
            {filteredShows.map((show) => (
              <PosterCard
                key={show.id}
                id={show.id}
                title={show.name}
                type={show.type}
                year={show.year}
                imageUrl={show.primaryImageUrl}
                is4K={show.is4K}
                isHDR={show.isHDR}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
