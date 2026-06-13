import { useParams, useNavigate } from 'react-router-dom';
import { AltArrowLeftBold, PlayBold, RestartBold, TVBold } from 'solar-icon-set';
import { formatRuntime } from '../../utils/formatRuntime';
import { useJellyfinDetail } from '../../hooks/useJellyfinDetail';
import { useJellyfinShowDetails } from '../../hooks/useJellyfinShowDetails';
import { usePlayback } from '../../hooks/usePlayback';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import './ShowDetailScreen.css';

export default function ShowDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const showId = id || '';

  const { item: show, isLoading: isShowLoading, error: showError } = useJellyfinDetail(showId);
  const {
    seasons,
    episodes,
    activeSeasonId,
    setActiveSeasonId,
    isLoading: isEpisodesLoading,
    error: _episodesError,
  } = useJellyfinShowDetails(showId);

  const navigate = useNavigate();
  const { startPlayback } = usePlayback();

  // Only block on show loading — episodes errors are shown inline
  const isLoading = isShowLoading;

  if (isLoading) {
    return (
      <div className="show-detail-loading">
        <div className="app-loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (showError || !show) {
    return (
      <div className="show-detail-error">
        <button className="detail-back-btn" onClick={() => navigate(-1)}>
          <AltArrowLeftBold size={18} /> Back
        </button>
        <h2>Error Loading Show</h2>
        <p>{showError || 'Show details not available.'}</p>
      </div>
    );
  }

  return (
    <div className="show-detail">
      {/* Back button */}
      <button className="detail-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
        <AltArrowLeftBold size={18} />
        <span>Back</span>
      </button>

      {/* Backdrop */}
      <div className="show-detail-backdrop">
        <div
          className="show-detail-backdrop-image"
          style={{
            backgroundImage: show.backdropImageUrl ? `url(${show.backdropImageUrl})` : undefined,
          }}
        />
        <div className="show-detail-backdrop-gradient" />
      </div>

      <div className="show-detail-content">
        {/* Left Column: Poster */}
        <div className="show-detail-sidebar">
          <div
            className="show-detail-poster"
            style={{
              backgroundImage: show.primaryImageUrl ? `url(${show.primaryImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Right Column: Info */}
        <div className="show-detail-info">
          <h1 className="show-detail-title">{show.name}</h1>

          <div className="show-detail-meta">
            {show.year && <span className="show-detail-meta-item">{show.year}</span>}
            {show.year && <span className="show-detail-meta-divider" />}
            <span className="show-detail-meta-item">{seasons.length} Seasons</span>
            {show.officialRating && (
              <>
                <span className="show-detail-meta-divider" />
                <span className="show-detail-meta-item">{show.officialRating}</span>
              </>
            )}
          </div>

          {/* Genres */}
          <div className="show-detail-genres">
            {show.genres.map((genre) => (
              <span key={genre} className="show-detail-genre">
                {genre}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="show-detail-overview">{show.overview}</p>

          {/* Season Selector */}
          {seasons.length > 0 && (
            <div className="show-detail-seasons-section">
              <h2 className="show-detail-section-title">Seasons</h2>
              <div className="show-detail-season-tabs">
                {seasons.map((season) => {
                  const isActive = season.id === activeSeasonId;
                  return (
                    <button
                      key={season.id}
                      className={`season-tab ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSeasonId(season.id)}
                    >
                      {season.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Episodes List */}
          <div className="show-detail-episodes-section">
            <h2 className="show-detail-section-title">Episodes</h2>
            
            {isEpisodesLoading ? (
              <div className="episodes-loading">
                <div className="app-loading-spinner" style={{ width: 24, height: 24 }} />
                <span>Loading episodes...</span>
              </div>
            ) : episodes.length > 0 ? (
              <div className="episodes-list">
                {episodes.map((episode) => {
                  const hasProgress = episode.playedPercentage > 0 && !episode.isWatched;
                  const formatEpisodeTime = (ticks: number): string => {
                    const totalSeconds = ticks / 10000000;
                    const m = Math.floor(totalSeconds / 60);
                    const s = Math.floor(totalSeconds % 60);
                    return `${m}:${s.toString().padStart(2, '0')}`;
                  };

                  return (
                    <div key={episode.id} className="episode-card">
                      <div
                        className="episode-thumbnail"
                        style={{
                          backgroundImage: episode.primaryImageUrl
                            ? `url(${episode.primaryImageUrl})`
                            : episode.backdropImageUrl
                            ? `url(${episode.backdropImageUrl})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <button
                          className="episode-play-overlay-btn"
                          aria-label={`Play ${episode.name}`}
                          onClick={() => startPlayback(episode, false)}
                        >
                          <PlayBold size={22} color="white" />
                        </button>
                      </div>

                      <div className="episode-info">
                        <div className="episode-header">
                          <span className="episode-number">
                            E{episode.episodeNumber?.toString().padStart(2, '0') || '00'}
                          </span>
                          <span className="episode-title">{episode.name}</span>
                          <span className="episode-runtime">
                            {formatRuntime(episode.runtimeMinutes)}
                          </span>
                          {episode.is4K && <Badge variant="purple">4K</Badge>}
                          {!episode.is4K && episode.is1080p && <Badge variant="purple">1080p</Badge>}
                          {!episode.is4K && !episode.is1080p && episode.is720p && <Badge variant="purple">720p</Badge>}
                          {episode.isHDR && <Badge variant="frost">HDR</Badge>}
                        </div>

                        <p className="episode-synopsis">
                          {episode.overview || 'No synopsis available for this episode.'}
                        </p>

                        <div className="episode-actions">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => startPlayback(episode, false)}
                          >
                            <PlayBold size={14} /> Play
                          </Button>
                          
                          {episode.resumePositionTicks > 0 && !episode.isWatched && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startPlayback(episode, true)}
                            >
                              <RestartBold size={14} /> Resume from {formatEpisodeTime(episode.resumePositionTicks)}
                            </Button>
                          )}

                          {hasProgress && (
                            <span className="episode-progress-badge">
                              {Math.round(episode.playedPercentage)}% watched
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="episodes-empty">
                <TVBold size={32} />
                <span>No episodes found in this season.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
