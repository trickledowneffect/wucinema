import { PlayBold, RestartBold, FlashDriveBold, SubtitlesBold, InfoCircleBold } from 'solar-icon-set';
import Button from '../Button/Button';
import Badge from '../Badge/Badge';
import { formatRuntime } from '../../utils/formatRuntime';
import type { WuCinemaMediaItem } from '../../services/jellyfin/jellyfinTypes';
import './SpotlightHero.css';

function formatResumeTime(ticks: number): string {
  const totalSeconds = ticks / 10000000;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SpotlightHeroProps {
  movie: WuCinemaMediaItem;
  onPlay: () => void;
  onResume: () => void;
  onDetails: () => void;
  onCache: () => void;
  onSubtitles: () => void;
}

export default function SpotlightHero({
  movie,
  onPlay,
  onResume,
  onDetails,
  onCache,
  onSubtitles
}: SpotlightHeroProps) {
  // Use backdrop or fallback to primary
  const bgImage = movie.backdropImageUrl || movie.primaryImageUrl;

  return (
    <div className="spotlight-hero">
      {/* Background Image with Fade transition */}
      <div 
        key={movie.id} // Key forces re-render for animation
        className="spotlight-hero-bg fade-in"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
        }}
      />
      <div className="spotlight-hero-gradient" />
      <div className="spotlight-hero-vignette" />

      {/* Content Area */}
      <div className="spotlight-hero-content fade-in-up" key={`content-${movie.id}`}>
        <h1 className="spotlight-hero-title">{movie.name}</h1>
        
        <div className="spotlight-hero-meta">
          {movie.year && <span className="meta-item">{movie.year}</span>}
          {movie.year && <span className="meta-divider" />}
          
          <span className="meta-item">{formatRuntime(movie.runtimeMinutes)}</span>
          
          {movie.officialRating && (
            <>
              <span className="meta-divider" />
              <span className="meta-item">{movie.officialRating}</span>
            </>
          )}

          {movie.communityRating && (
            <>
              <span className="meta-divider" />
              <span className="meta-item">⭐ {movie.communityRating.toFixed(1)}/10</span>
            </>
          )}

          <div className="spotlight-hero-badges">
            {movie.is4K && <Badge variant="orange">4K</Badge>}
            {movie.isHDR && <Badge variant="frost">HDR</Badge>}
            {movie.isWatched && <Badge variant="success">Watched</Badge>}
          </div>
        </div>

        <div className="spotlight-hero-genres">
          {movie.genres.slice(0, 4).map(g => (
            <span key={g} className="genre-chip">{g}</span>
          ))}
        </div>

        <p className="spotlight-hero-overview">
          {movie.overview || "No overview available."}
        </p>

        {movie.playedPercentage > 0 && !movie.isWatched && (
          <div className="spotlight-hero-progress-container">
            <div className="spotlight-hero-progress-bar" style={{ width: `${movie.playedPercentage}%` }} />
          </div>
        )}

        <div className="spotlight-hero-actions">
          <Button variant="primary" size="lg" onClick={onPlay}>
            <PlayBold size={18} /> Play
          </Button>
          
          {movie.resumePositionTicks > 0 && !movie.isWatched && (
            <Button variant="secondary" onClick={onResume}>
              <RestartBold size={18} /> Resume from {formatResumeTime(movie.resumePositionTicks)}
            </Button>
          )}

          <Button variant="secondary" onClick={onDetails}>
            <InfoCircleBold size={18} /> Details
          </Button>

          <Button variant="ghost" onClick={onCache}>
            <FlashDriveBold size={18} /> Cache
          </Button>

          <Button variant="ghost" onClick={onSubtitles}>
            <SubtitlesBold size={18} /> Subtitles
          </Button>
        </div>
      </div>
    </div>
  );
}
