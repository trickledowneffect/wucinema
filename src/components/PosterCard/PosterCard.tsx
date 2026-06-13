import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../Badge/Badge';
import './PosterCard.css';

interface PosterCardProps {
  id: string;
  title: string;
  type?: string;
  year?: number;
  posterGradient?: string;
  imageUrl?: string;
  is4K?: boolean;
  isHDR?: boolean;
  isCached?: boolean;
  hasSubtitles?: boolean;
  progress?: number;
  isWatched?: boolean;
  unplayedCount?: number;
}

export default function PosterCard({
  id,
  title,
  type,
  year,
  posterGradient,
  imageUrl,
  is4K,
  isHDR,
  isCached,
  hasSubtitles,
  progress,
  isWatched,
  unplayedCount,
}: PosterCardProps) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (type === 'Series' || type === 'tvshow' || type === 'Show') {
      navigate(`/show/${id}`);
    } else if (type === 'BoxSet') {
      navigate(`/collection/${id}`);
    } else {
      navigate(`/movie/${id}`);
    }
  };

  return (
    <div
      className="poster-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={`poster-card-image ${imgLoaded ? 'poster-card-image--loaded' : ''}`}
        style={{ background: posterGradient || 'var(--bg-surface-3)' }}
      >
        {/* Actual image */}
        {imageUrl && !imgError && (
          <img
            src={imageUrl}
            alt={title}
            className="poster-card-img"
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

        {/* Glass shine overlay — top-left highlight */}
        <div className="poster-card-shine" />

        {/* Bottom gradient for text readability */}
        <div className="poster-card-gradient" />

        {/* Badges */}
        <div className="poster-card-badges">
          {is4K && <Badge variant="orange">4K</Badge>}
          {isHDR && <Badge variant="frost">HDR</Badge>}
          {isCached && <Badge variant="success">Cached</Badge>}
          {hasSubtitles && <Badge variant="default">SUB</Badge>}
          {isWatched && <div className="poster-card-watched-dot" title="Watched" />}
        </div>

        {/* Blue unplayed episodes count badge */}
        {unplayedCount !== undefined && unplayedCount > 0 && (
          <div className="poster-card-unplayed-badge" title={`${unplayedCount} unplayed episodes`}>
            {unplayedCount}
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && progress < 100 && (
          <div className="poster-card-progress">
            <div
              className="poster-card-progress-bar"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Hover play button */}
        <div className="poster-card-play">
          <div className="poster-card-play-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="poster-card-info">
        <div className="poster-card-title" title={title}>{title}</div>
        {year && <div className="poster-card-year">{year}</div>}
      </div>
    </div>
  );
}
