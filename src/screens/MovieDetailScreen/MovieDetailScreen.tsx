import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import SubtitlePanel from '../../components/SubtitlePanel/SubtitlePanel';
import { AltArrowLeftBold, PlayBold, RestartBold, FlashDriveBold, SubtitlesBold, UserBold } from 'solar-icon-set';
import { formatRuntime } from '../../utils/formatRuntime';
import { useJellyfinDetail } from '../../hooks/useJellyfinDetail';
import { usePlayback } from '../../hooks/usePlayback';
import type { CastMember } from '../../services/jellyfin/jellyfinTypes';
import './MovieDetailScreen.css';

function formatResumeTime(ticks: number): string {
  const totalSeconds = ticks / 10000000;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function CastAvatar({ member }: { member: CastMember }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="cast-member">
      <div className="cast-member-avatar-wrap">
        {member.imageUrl && !imgError ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="cast-member-photo"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="cast-member-avatar-placeholder">
            <UserBold size={22} />
          </div>
        )}
        {/* Subtle ring glow */}
        <div className="cast-member-avatar-ring" />
      </div>
      <span className="cast-member-name" title={member.name}>{member.name}</span>
      {member.role && (
        <span className="cast-member-character" title={member.role}>{member.role}</span>
      )}
    </div>
  );
}

export default function MovieDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, isLoading, error } = useJellyfinDetail(id || '');
  const { startPlayback } = usePlayback();

  const handleActionClick = (feature: string, phase: number) => {
    alert(`The ${feature} feature will be implemented in Phase ${phase}.`);
  };

  if (isLoading && !item) {
    return (
      <div className="movie-detail movie-detail--loading">
        <div className="app-loading-spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="movie-detail" style={{ padding: 'var(--space-8)' }}>
        <h2>Error Loading Detail</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Item not found'}</p>
      </div>
    );
  }

  return (
    <div className="movie-detail">
      {/* Full-height cinematic backdrop */}
      <div className="movie-detail-backdrop">
        {item.backdropImageUrl && (
          <img
            src={item.backdropImageUrl}
            alt=""
            className="movie-detail-backdrop-img"
            aria-hidden="true"
          />
        )}
        <div className="movie-detail-backdrop-vignette" />
        <div className="movie-detail-backdrop-bottom" />
        <div className="movie-detail-backdrop-left" />
      </div>

      {/* Back button — floating over backdrop */}
      <button className="detail-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
        <AltArrowLeftBold size={18} />
        <span>Back</span>
      </button>

      {/* Glass content card */}
      <div className="movie-detail-content">
        {/* Poster with glass depth effect */}
        <div className="movie-detail-poster-col">
          <div className="movie-detail-poster-frame">
            {item.primaryImageUrl ? (
              <img
                src={item.primaryImageUrl}
                alt={item.name}
                className="movie-detail-poster-img"
              />
            ) : (
              <div className="movie-detail-poster-placeholder" />
            )}
            <div className="movie-detail-poster-shine" />
          </div>
        </div>

        {/* Info panel */}
        <div className="movie-detail-info">
          <h1 className="movie-detail-title">{item.name}</h1>

          {/* Meta row */}
          <div className="movie-detail-meta">
            {item.year && <span className="movie-detail-meta-item">{item.year}</span>}
            {item.year && <span className="movie-detail-meta-divider" />}
            <span className="movie-detail-meta-item">{formatRuntime(item.runtimeMinutes)}</span>
            {item.officialRating && (
              <>
                <span className="movie-detail-meta-divider" />
                <span className="movie-detail-meta-rating">{item.officialRating}</span>
              </>
            )}
            {item.communityRating && (
              <>
                <span className="movie-detail-meta-divider" />
                <span className="movie-detail-meta-item movie-detail-meta-score">
                  ⭐ {item.communityRating.toFixed(1)}
                </span>
              </>
            )}
            {item.is4K && <Badge variant="purple">4K</Badge>}
            {!item.is4K && item.is1080p && <Badge variant="purple">1080p</Badge>}
            {!item.is4K && !item.is1080p && item.is720p && <Badge variant="purple">720p</Badge>}
            {item.isHDR && <Badge variant="frost">HDR</Badge>}
            {item.isWatched && <Badge variant="success">Watched</Badge>}
          </div>

          {/* Genres */}
          {item.genres.length > 0 && (
            <div className="movie-detail-genres">
              {item.genres.map((genre) => (
                <span key={genre} className="movie-detail-genre">{genre}</span>
              ))}
            </div>
          )}

          {/* Overview */}
          {item.overview && (
            <p className="movie-detail-overview">{item.overview}</p>
          )}

          {/* Actions */}
          <div className="movie-detail-actions">
            <Button variant="primary" size="lg" ariaLabel="Play movie" onClick={() => startPlayback(item, false)}>
              <PlayBold size={18} /> Play
            </Button>
            {item.resumePositionTicks > 0 && !item.isWatched && (
              <Button variant="secondary" ariaLabel="Resume playback" onClick={() => startPlayback(item, true)}>
                <RestartBold size={18} /> Resume from {formatResumeTime(item.resumePositionTicks)}
              </Button>
            )}
            <Button variant="secondary" ariaLabel="Cache for offline viewing" onClick={() => handleActionClick('Offline Caching', 5)}>
              <FlashDriveBold size={18} /> Cache Offline
            </Button>
            <Button variant="ghost" ariaLabel="Manage subtitles" onClick={() => handleActionClick('Subtitle Download', 6)}>
              <SubtitlesBold size={18} /> Subtitles
            </Button>
          </div>

          {/* Cast */}
          {item.cast && item.cast.length > 0 && (
            <div className="movie-detail-cast-section">
              <h2 className="movie-detail-section-title">Top Cast</h2>
              <div className="movie-detail-cast">
                {item.cast.map((member) => (
                  <CastAvatar key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {/* Subtitle Panel */}
          <div className="movie-detail-subtitle-panel">
            <SubtitlePanel
              itemId={item.id}
              movieTitle={item.name}
              movieYear={item.year}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
