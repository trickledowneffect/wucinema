import { useNavigate } from 'react-router-dom';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import MediaGrid from '../../components/MediaGrid/MediaGrid';
import PosterCard from '../../components/PosterCard/PosterCard';
import LandscapeCard from '../../components/LandscapeCard/LandscapeCard';
import Badge from '../../components/Badge/Badge';
import { mockDownloads } from '../../data/mockMedia';
import { useJellyfinHome } from '../../hooks/useJellyfinHome';
import { Download } from 'lucide-react';
import './HomeScreen.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { resumeItems, latestMovies, latestShows, heroItem, isLoading, error } = useJellyfinHome();

  const activeDownload = mockDownloads.find((d) => d.status === 'downloading');

  if (isLoading && !heroItem && !latestMovies.length) {
    return (
      <div className="home-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (error && !heroItem) {
    return (
      <div className="home-screen" style={{ padding: 'var(--space-8)' }}>
        <h2>Error Loading Home</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="home-screen">
      {/* Hero Banner */}
      {heroItem && (
        <HeroBanner
          title={heroItem.name}
          year={heroItem.year || 0}
          runtime={heroItem.runtimeMinutes}
          rating={heroItem.officialRating || ''}
          score={heroItem.communityRating || 0}
          genres={heroItem.genres}
          overview={heroItem.overview || ''}
          imageUrl={heroItem.backdropImageUrl || heroItem.primaryImageUrl}
        />
      )}

      {/* Active Download Banner */}
      {activeDownload && (
        <div className="home-downloading-banner">
          <Download className="home-downloading-icon" size={20} />
          <div className="home-downloading-info">
            <div className="home-downloading-title">
              Downloading: {activeDownload.title}
            </div>
            <div className="home-downloading-meta">
              {activeDownload.downloadedSize} / {activeDownload.totalSize} •{' '}
              {activeDownload.speed}
            </div>
          </div>
          <div className="home-downloading-progress">
            <div
              className="home-downloading-progress-bar"
              style={{ width: `${activeDownload.progress || 0}%` }}
            />
          </div>
          <Badge variant="orange">{activeDownload.progress}%</Badge>
        </div>
      )}

      {/* Continue Watching */}
      {resumeItems.length > 0 && (
        <MediaGrid title="Continue Watching">
          {resumeItems.map((item) => (
            <LandscapeCard
              key={item.id}
              title={item.name}
              subtitle={item.seriesName || (item.year ? item.year.toString() : undefined)}
              progress={item.playedPercentage}
              imageUrl={item.backdropImageUrl || item.primaryImageUrl}
              is4K={item.is4K}
              isHDR={item.isHDR}
              onClick={() => navigate(item.type === 'Episode' ? `/show/${item.seriesId || item.id}` : `/movie/${item.id}`)}
            />
          ))}
        </MediaGrid>
      )}

      {/* Recently Added in Movies */}
      {latestMovies.length > 0 && (
        <MediaGrid title="Recently Added in Movies" seeAllLink="/movies">
          {latestMovies.map((movie) => (
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
        </MediaGrid>
      )}

      {/* Recently Added in Shows */}
      {latestShows.length > 0 && (
        <MediaGrid title="Recently Added in Shows" seeAllLink="/tv-shows">
          {latestShows.map((show) => (
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
              unplayedCount={show.unplayedCount}
            />
          ))}
        </MediaGrid>
      )}
    </div>
  );
}
