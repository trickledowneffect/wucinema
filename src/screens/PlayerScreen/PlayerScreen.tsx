import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Subtitles,
  Languages,
  TimerReset,
  Settings,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { usePlaybackContext } from '../../context/PlaybackContext';
import { useJellyfinDetail } from '../../hooks/useJellyfinDetail';
import { mockMovies } from '../../data/mockMedia';
import type { WuCinemaMediaItem } from '../../services/jellyfin/jellyfinTypes';
import { formatRuntime } from '../../utils/formatRuntime';
import { getPlaybackSettings } from '../../services/playback/playbackSettings';
import { safeMediaDisplayName, sanitizePlaybackError } from '../../services/playback/playbackPrivacy';
import { isEmbedSupported } from '../../services/playback/engines/MpvSidecarEngine';
import './PlayerScreen.css';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const detailItemId = itemId === 'demo' ? '' : itemId || '';
  const { item: remoteItem, isLoading } = useJellyfinDetail(detailItemId);
  const {
    isPlaying,
    playingItem,
    playbackEngine,
    playbackState,
    playbackMode,
    integratedStatus,
    requestedResume,
    startExternalFallback,
    stopPlayback,
  } = usePlaybackContext();

  const [showControls, setShowControls] = useState(true);
  const [timePos, setTimePos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [prototypePaused, setPrototypePaused] = useState(false);
  const [prototypeTime, setPrototypeTime] = useState(0);
  const hideTimerRef = useRef<number | null>(null);

  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [activeAudioTrackId, setActiveAudioTrackId] = useState<number | string | null>(null);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const settings = useMemo(() => getPlaybackSettings(), []);
  const demoMovie = mockMovies[0];
  const demoItem: WuCinemaMediaItem = useMemo(
    () => ({
      id: demoMovie.id,
      name: demoMovie.title,
      type: 'Movie',
      year: demoMovie.year,
      overview: demoMovie.overview,
      runtimeMinutes: demoMovie.runtime,
      communityRating: demoMovie.score,
      officialRating: demoMovie.rating,
      genres: demoMovie.genres,
      cast: [],
      isWatched: demoMovie.isWatched,
      playedPercentage: demoMovie.progress || 0,
      resumePositionTicks: 0,
      is4K: demoMovie.is4K,
      isHDR: demoMovie.isHDR,
      videoCodec: demoMovie.codec,
      audioCodec: demoMovie.audioCodec,
    }),
    [demoMovie],
  );
  const activeItem: WuCinemaMediaItem | null = playingItem?.id === itemId ? playingItem : remoteItem || (itemId === 'demo' ? demoItem : null);
  const prototypeMode = itemId === 'demo' || (!playbackEngine && !playingItem && !remoteItem);
  const displayTitle = safeMediaDisplayName(activeItem || null);
  const runtimeLabel = activeItem ? formatRuntime(activeItem.runtimeMinutes) : 'Unknown runtime';
  const prototypeDuration = activeItem?.runtimeMinutes ? activeItem.runtimeMinutes * 60 : 0;

  const effectiveDuration = duration > 0
    ? duration
    : prototypeDuration > 0
    ? prototypeDuration
    : activeItem?.runtimeMinutes
    ? activeItem.runtimeMinutes * 60
    : 0;

  const handleBack = useCallback(async () => {
    await stopPlayback();
    navigate(-1);
  }, [navigate, stopPlayback]);

  const handlePlayPause = async () => {
    if (prototypeMode) {
      setPrototypePaused((current) => !current);
      return;
    }

    if (!playbackEngine) return;
    try {
      if (playbackState === 'paused') {
        await playbackEngine.resume();
      } else {
        await playbackEngine.pause();
      }
    } catch (error) {
      setLocalError(sanitizePlaybackError(error));
    }
  };

  const handleSeek = async (value: number) => {
    if (prototypeMode) {
      setPrototypeTime(value);
      setTimePos(value);
      return;
    }

    if (!playbackEngine) return;
    try {
      await playbackEngine.seekTo(value);
      setTimePos(value);
    } catch (error) {
      setLocalError(sanitizePlaybackError(error));
    }
  };

  const handleVolumeChange = async (value: number) => {
    if (prototypeMode) {
      setVolume(value);
      if (value > 0 && muted) {
        setMuted(false);
      }
      return;
    }

    if (!playbackEngine) {
      setVolume(value);
      return;
    }

    try {
      await playbackEngine.setVolume(value);
      setVolume(value);
      if (value > 0 && muted) {
        await playbackEngine.setMute(false);
        setMuted(false);
      }
    } catch (error) {
      setLocalError(sanitizePlaybackError(error));
    }
  };

  const handleToggleMute = async () => {
    if (prototypeMode) {
      setMuted((current) => !current);
      return;
    }

    if (!playbackEngine) {
      setMuted((current) => !current);
      return;
    }

    try {
      await playbackEngine.setMute(!muted);
      setMuted(!muted);
    } catch (error) {
      setLocalError(sanitizePlaybackError(error));
    }
  };

  const handleUseFallback = async () => {
    if (!activeItem) return;

    try {
      await startExternalFallback(activeItem, requestedResume);
    } catch (error) {
      setLocalError(sanitizePlaybackError(error));
    }
  };

  useEffect(() => {
    if (!prototypeMode) {
      setPrototypeTime(0);
      setPrototypePaused(false);
      return;
    }

    setDuration(prototypeDuration);
    setTimePos(prototypeTime);
    if (prototypePaused) return;

    const timer = window.setInterval(() => {
      setPrototypeTime((current) => {
        if (!prototypeDuration) return current + 1;
        const next = current + 1;
        return next >= prototypeDuration ? 0 : next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [prototypeMode, prototypePaused, prototypeDuration, prototypeTime]);

  useEffect(() => {
    const handleStateChange = (_e: any, payload: any) => {
      if (typeof payload?.state === 'string') {
        // no-op for now, but keep the hook active for future embedded playback
      }
    };
    const handleTimeUpdate = (_e: any, payload: any) => {
      if (typeof payload?.timePos === 'number') setTimePos(payload.timePos);
    };
    const handleDuration = (_e: any, payload: any) => {
      if (typeof payload?.duration === 'number') setDuration(payload.duration);
    };
    const handleVolume = (_e: any, payload: any) => {
      if (typeof payload?.volume === 'number') setVolume(payload.volume);
      if (typeof payload?.muted === 'boolean') setMuted(payload.muted);
    };
    const handleError = (_e: any, payload: any) => {
      if (payload?.error) setLocalError(String(payload.error));
    };

    playbackEngine?.on('statechange', handleStateChange);
    playbackEngine?.on('timeupdate', handleTimeUpdate);
    playbackEngine?.on('durationchange', handleDuration);
    playbackEngine?.on('volumechange', handleVolume);
    playbackEngine?.on('error', handleError);

    return () => {
      playbackEngine?.off('statechange', handleStateChange);
      playbackEngine?.off('timeupdate', handleTimeUpdate);
      playbackEngine?.off('durationchange', handleDuration);
      playbackEngine?.off('volumechange', handleVolume);
      playbackEngine?.off('error', handleError);
    };
  }, [playbackEngine]);

  useEffect(() => {
    const handleTracks = (_e: any, payload: any) => {
      if (Array.isArray(payload?.tracks)) {
        const audio = payload.tracks.filter((t: any) => t.type === 'audio');
        setAudioTracks(audio);
        const selected = audio.find((t: any) => t.selected);
        if (selected) {
          setActiveAudioTrackId(selected.id);
        }
      }
    };

    playbackEngine?.on('trackschange', handleTracks);
    return () => {
      playbackEngine?.off('trackschange', handleTracks);
    };
  }, [playbackEngine]);

  useEffect(() => {
    if (!showAudioMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.player-menu-container')) {
        setShowAudioMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showAudioMenu]);

  const stateRef = useRef({
    prototypeMode,
    prototypeTime,
    timePos,
    volume,
    muted,
    effectiveDuration,
  });

  stateRef.current = {
    prototypeMode,
    prototypeTime,
    timePos,
    volume,
    muted,
    effectiveDuration,
  };

  const toggleFullscreen = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const isFull = await win.isFullscreen();
        await win.setFullscreen(!isFull);
      } catch (err) {
        console.error('Failed to toggle fullscreen in Tauri:', err);
      }
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error('Failed to enter browser fullscreen:', err);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.error('Failed to exit browser fullscreen:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    const resetHideTimer = () => {
      setShowControls(true);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 2800);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target && 
        (target.tagName === 'TEXTAREA' || 
         (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') ||
         target.isContentEditable)
      ) {
        return;
      }

      const key = event.key;
      const { prototypeMode: pm, prototypeTime: pt, timePos: tp, volume: vol, effectiveDuration: dur } = stateRef.current;

      if (key === 'Escape') {
        event.preventDefault();
        void handleBack();
        return;
      }
      if (key === ' ' || key === 'Spacebar') {
        event.preventDefault();
        void handlePlayPause();
        return;
      }
      if (key === 'ArrowLeft') {
        event.preventDefault();
        const currentVal = pm ? pt : tp;
        const targetSeek = Math.max(0, currentVal - 10);
        void handleSeek(targetSeek);
        return;
      }
      if (key === 'ArrowRight') {
        event.preventDefault();
        const currentVal = pm ? pt : tp;
        const targetSeek = Math.min(dur, currentVal + 10);
        void handleSeek(targetSeek);
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        const newVol = Math.min(100, vol + 5);
        void handleVolumeChange(newVol);
        return;
      }
      if (key === 'ArrowDown') {
        event.preventDefault();
        const newVol = Math.max(0, vol - 5);
        void handleVolumeChange(newVol);
        return;
      }
      if (key === 'f' || key === 'F') {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (key === 'm' || key === 'M') {
        event.preventDefault();
        void handleToggleMute();
        return;
      }

      resetHideTimer();
    };

    window.addEventListener('mousemove', resetHideTimer);
    window.addEventListener('keydown', handleKeyDown);
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', resetHideTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, [handleBack]);

  useEffect(() => {
    if (!playbackEngine && settings.useExternalFallbackWhenUnavailable && activeItem && isPlaying) {
      void handleUseFallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackEngine, activeItem, isPlaying, settings.useExternalFallbackWhenUnavailable]);


  const methodLabel =
    prototypeMode
      ? 'Working prototype'
      : playbackMode === 'embedded'
      ? 'Embedded player'
      : playbackMode === 'fallback'
      ? 'Fallback external player'
      : integratedStatus === 'ready'
        ? 'Integrated player'
        : 'Preparing integrated player';

  const methodDetail =
    prototypeMode
      ? 'Simulated playback'
      : playbackMode === 'embedded'
      ? 'mpv embedded via WID'
      : playbackMode === 'fallback'
      ? 'mpv sidecar fallback'
      : integratedStatus === 'ready'
        ? 'Ready'
        : 'Integrated player not ready yet';

  const playbackSummary =
    activeItem
      ? [
          activeItem.is4K ? '4K' : 'HD',
          activeItem.isHDR ? 'HDR' : null,
          activeItem.videoCodec ? activeItem.videoCodec.toUpperCase() : null,
        ]
          .filter(Boolean)
          .join(' ')
      : 'Unknown';

  const prototypePlaybackState = prototypePaused ? 'paused' : 'playing';

  const videoReady = !!playbackEngine;

  const isVideoActive =
    (playbackMode === 'integrated' || playbackMode === 'embedded') &&
    playbackState !== 'idle' &&
    playbackState !== 'buffering' &&
    playbackState !== 'error';

  return (
    <div
      className={`player-screen ${showControls ? 'controls-visible' : 'controls-hidden'} ${
        playbackMode === 'integrated' ? 'player-screen--integrated' : ''
      } ${isVideoActive ? 'player-screen--video-active' : ''}`}
    >
      <div className="player-backdrop" />

      <div className="player-topbar">
        <button className="player-icon-btn" onClick={() => void handleBack()} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="player-titleblock">
          <div className="player-title">{displayTitle}</div>
          <div className="player-subtitle">
            {activeItem?.year || 'Unknown year'} • {runtimeLabel}
            {activeItem?.officialRating ? ` • ${activeItem.officialRating}` : ''}
          </div>
        </div>
        <div className="player-status">
          <span className="player-status-label">{methodLabel}</span>
          <span className="player-status-value">{methodDetail}</span>
        </div>
      </div>

      <div className="player-center">
        <div className="player-stage">
          {/* Embedded: mpv paints into this div on Windows via --wid */}
          {playbackMode === 'embedded' && (
            <div id="mpv-host" className="player-stage-embed" />
          )}
          <div
            className={`player-stage-media ${
              prototypeMode ? 'player-stage-media--prototype' : ''
            } ${playbackMode === 'embedded' ? 'player-stage-media--hidden' : ''}`}
            style={{
              backgroundImage: activeItem?.backdropImageUrl
                ? `url(${activeItem.backdropImageUrl})`
                : undefined,
            }}
          >
            <div className="player-stage-vignette" />
            {prototypeMode && (
              <div className="player-stage-banner">
                Working prototype
              </div>
            )}
          </div>
        </div>

        {!videoReady && !prototypeMode && (
          <div className="player-not-ready">
            <div className="player-not-ready-title">
              {isEmbedSupported()
                ? 'Embedded player — launching mpv'
                : 'Integrated player not ready yet'}
            </div>
            <div className="player-not-ready-copy">
              {isEmbedSupported()
                ? 'WU-CINE is embedding mpv inside this window on Windows. If video does not appear, try the fallback.'
                : 'WU-CINE is staged to use an embedded libmpv surface by default. For now, you can use the mpv fallback manually or enable auto-fallback in Playback settings.'}
            </div>
            <div className="player-not-ready-actions">
              <button className="player-action-btn player-action-btn--primary" onClick={() => void handleUseFallback()}>
                <Play size={16} />
                Use fallback mpv
              </button>
              <button className="player-action-btn" onClick={() => navigate('/settings')}>
                <Settings size={16} />
                Playback settings
              </button>
            </div>
          </div>
        )}
        {prototypeMode && (
          <div className="player-not-ready">
            <div className="player-not-ready-title">Prototype playback</div>
            <div className="player-not-ready-copy">
              This demo route is self-contained and lets you test the player shell, controls, and timeline without a server.
            </div>
            <div className="player-not-ready-actions">
              <button className="player-action-btn player-action-btn--primary" onClick={() => void handlePlayPause()}>
                {prototypePaused ? <Play size={16} /> : <Pause size={16} />}
                {prototypePaused ? 'Resume preview' : 'Pause preview'}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="player-loading">
            <Loader2 className="spinning" size={34} />
            <span>Loading media details...</span>
          </div>
        )}

        {localError && (
          <div className="player-error">
            {localError}
          </div>
        )}
      </div>

      <div className="player-controls-panel">
        <div className="player-scrub-row">
          <span className="player-time">{formatTime(prototypeMode ? prototypeTime : timePos)}</span>
          <input
            type="range"
            className="player-seekbar"
            min="0"
            max={effectiveDuration || 1}
            value={Math.min(prototypeMode ? prototypeTime : timePos, effectiveDuration || 1)}
            onChange={(e) => void handleSeek(parseFloat(e.target.value))}
          />
          <span className="player-time">{formatTime(effectiveDuration)}</span>
        </div>

        <div className="player-controls-row">
          <button className="player-icon-btn player-icon-btn--wide" onClick={() => void handlePlayPause()} disabled={!playbackEngine && !prototypeMode}>
            {(prototypeMode ? prototypePlaybackState === 'paused' : playbackState === 'paused') ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button className="player-icon-btn" onClick={() => void handleToggleMute()} aria-label="Mute">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            className="player-volume"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => void handleVolumeChange(parseInt(e.target.value, 10))}
          />

          <div className="player-track-group">
            <div className="player-menu-container">
              <button 
                className="player-chip" 
                type="button" 
                onClick={() => setShowAudioMenu(!showAudioMenu)}
              >
                <Languages size={14} />
                {activeAudioTrackId !== null 
                  ? `Audio: ${audioTracks.find(t => t.id === activeAudioTrackId)?.lang?.toUpperCase() || `Track ${activeAudioTrackId}`}` 
                  : 'Audio 1'}
              </button>
              {showAudioMenu && audioTracks.length > 0 && (
                <div className="player-menu-dropdown">
                  {audioTracks.map((track) => (
                    <button
                      key={track.id}
                      className={`player-menu-item ${track.id === activeAudioTrackId ? 'active' : ''}`}
                      onClick={async () => {
                        if (playbackEngine) {
                          await playbackEngine.setAudioTrack(track.id);
                          setActiveAudioTrackId(track.id);
                        }
                        setShowAudioMenu(false);
                      }}
                    >
                      Track {track.id} {track.lang ? `(${track.lang.toUpperCase()})` : ''} {track.title ? `- ${track.title}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="player-chip" type="button">
              <Subtitles size={14} />
              Subtitles Off
            </button>
            <button className="player-chip" type="button">
              <TimerReset size={14} />
              Delay 0.0s
            </button>
          </div>

          <div className="player-spacer" />

          <div className="player-stats">
            <span>{playbackSummary}</span>
            <span>{methodLabel}</span>
          </div>

          <button className="player-icon-btn" aria-label="Playback stats">
            <SlidersHorizontal size={18} />
          </button>
          <button className="player-icon-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            <Maximize size={18} />
          </button>
        </div>
      </div>

      <div className="player-footer">
        <div className="player-footnote">
          {prototypeMode ? 'Prototype mode is local and self-contained.' : settings.preferredPlayer === 'integrated' ? 'Integrated player is the default target.' : 'External player is selected.'}
        </div>
        <div className="player-footnote">
          Avoid transcoding: {settings.avoidTranscoding ? 'On' : 'Off'} • Prefer direct play: {settings.preferDirectPlay ? 'On' : 'Off'}
        </div>
      </div>
    </div>
  );
}
