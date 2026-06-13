import Badge from '../Badge/Badge';
import './LandscapeCard.css';

interface LandscapeCardProps {
  title: string;
  subtitle?: string;
  progress?: number;
  backdropGradient?: string;
  imageUrl?: string;
  is4K?: boolean;
  isHDR?: boolean;
  onClick?: () => void;
}

export default function LandscapeCard({
  title,
  subtitle,
  progress,
  backdropGradient,
  imageUrl,
  is4K,
  isHDR,
  onClick,
}: LandscapeCardProps) {
  return (
    <div
      className="landscape-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className="landscape-card-image"
        style={{
          background: backdropGradient || 'var(--bg-surface-3)',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="landscape-card-overlay">
          {(is4K || isHDR) && (
            <div className="landscape-card-badges">
              {is4K && <Badge variant="orange">4K</Badge>}
              {isHDR && <Badge variant="frost">HDR</Badge>}
            </div>
          )}

          <div className="landscape-card-title">{title}</div>
          {subtitle && (
            <div className="landscape-card-subtitle">{subtitle}</div>
          )}
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className="landscape-card-progress">
          <div
            className="landscape-card-progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
