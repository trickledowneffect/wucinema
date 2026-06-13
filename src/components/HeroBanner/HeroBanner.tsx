import { PlayBold, RestartBold, FlashDriveBold, SubtitlesBold } from 'solar-icon-set';
import Button from '../Button/Button';
import { formatRuntime } from '../../utils/formatRuntime';
import './HeroBanner.css';

interface HeroBannerProps {
  title: string;
  year: number;
  runtime: number;
  rating: string;
  score: number;
  genres: string[];
  overview: string;
  backdropGradient?: string;
  imageUrl?: string;
}

export default function HeroBanner({
  title,
  year,
  runtime,
  rating,
  score,
  genres,
  overview,
  backdropGradient,
  imageUrl,
}: HeroBannerProps) {
  return (
    <section className="hero-banner" aria-label={`Featured: ${title}`}>
      <div
        className="hero-banner-backdrop"
        style={{
          background: backdropGradient || 'var(--bg-surface-1)',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
        }}
      />
      <div className="hero-banner-gradient" />

      <div className="hero-banner-content">
        <div className="hero-banner-chips">
          {genres.slice(0, 3).map((genre) => (
            <span key={genre} className="hero-banner-chip">
              {genre}
            </span>
          ))}
          <span className="hero-banner-chip">{rating}</span>
          <span className="hero-banner-chip">⭐ {score.toFixed(1)}</span>
          <span className="hero-banner-chip">{formatRuntime(runtime)}</span>
          <span className="hero-banner-chip">{year}</span>
        </div>

        <h1 className="hero-banner-title">{title}</h1>

        <p className="hero-banner-overview">{overview}</p>

        <div className="hero-banner-actions">
          <Button variant="primary" ariaLabel="Play">
            <PlayBold size={18} /> Play
          </Button>
          <Button variant="secondary" ariaLabel="Resume">
            <RestartBold size={18} /> Resume
          </Button>
          <Button variant="secondary" ariaLabel="Cache offline">
            <FlashDriveBold size={18} /> Cache Offline
          </Button>
          <Button variant="ghost" ariaLabel="Subtitles">
            <SubtitlesBold size={18} /> Subtitles
          </Button>
        </div>
      </div>
    </section>
  );
}
