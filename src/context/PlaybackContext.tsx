import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { type NavigateFunction } from 'react-router-dom';
import type { WuCinemaMediaItem } from '../services/jellyfin/jellyfinTypes';
import { reportPlaybackStart, reportPlaybackStopped, reportPlaybackProgress, getPlaybackStreamUrl } from '../services/jellyfin/jellyfinPlayback';
import { useAuth } from './AuthContext';
import { IPlaybackEngine, PlaybackState } from '../services/playback/PlaybackEngine';
import { LibMpvEmbeddedEngine } from '../services/playback/engines/LibMpvEmbeddedEngine';
import { MpvSidecarEngine } from '../services/playback/engines/MpvSidecarEngine';
import { isEmbedSupported } from '../services/playback/engines/MpvSidecarEngine';
import { getPlaybackSettings, type PlaybackAvailability } from '../services/playback/playbackSettings';
import { safeMediaDisplayName, sanitizePlaybackError } from '../services/playback/playbackPrivacy';

interface PlaybackContextType {
  isPlaying: boolean;
  playingItem: WuCinemaMediaItem | null;
  playbackEngine: IPlaybackEngine | null;
  playbackState: PlaybackState;
  playbackMode: 'integrated' | 'embedded' | 'fallback' | null;
  integratedStatus: PlaybackAvailability;
  requestedResume: boolean;
  startPlayback: (item: WuCinemaMediaItem, resume?: boolean) => Promise<void>;
  startExternalFallback: (itemOverride?: WuCinemaMediaItem, resumeOverride?: boolean) => Promise<void>;
  stopPlayback: () => Promise<void>;
  registerNavigator: (navigate: NavigateFunction) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingItem, setPlayingItem] = useState<WuCinemaMediaItem | null>(null);
  const [playbackEngine, setPlaybackEngine] = useState<IPlaybackEngine | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [playbackMode, setPlaybackMode] = useState<'integrated' | 'embedded' | 'fallback' | null>(null);
  const [integratedStatus] = useState<PlaybackAvailability>(() => {
    const engine = new LibMpvEmbeddedEngine();
    return engine.getAvailability?.() || 'not-ready';
  });
  const [requestedResume, setRequestedResume] = useState(false);
  const engineRef = useRef<IPlaybackEngine | null>(null);
  const navigatorRef = useRef<NavigateFunction | null>(null);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        void engineRef.current.destroy?.();
      }
    };
  }, []);

  // Poll progress every 10 seconds
  useEffect(() => {
    if (!isPlaying || !playingItem || !playbackEngine || !session) return;

    const intervalId = setInterval(() => {
      const state = playbackEngine.getState();
      if (state !== 'playing' && state !== 'paused') return;

      const timePos = playbackEngine.getTimePos();
      const positionTicks = Math.floor(timePos * 10000000);

      reportPlaybackProgress(session.activeServerUrl || session.serverUrl, session.accessToken, session.userId, {
        ItemId: playingItem.id,
        MediaSourceId: playingItem.id,
        PositionTicks: positionTicks,
        IsPaused: state === 'paused',
        IsMuted: false,
      }).catch((error) => {
        console.error('[Playback] Progress sync failed:', sanitizePlaybackError(error));
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isPlaying, playingItem, playbackEngine, session]);

  const destroyEngine = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.stop();
      await engineRef.current.destroy?.();
    }

    engineRef.current = null;
    setPlaybackEngine(null);
  }, []);

  const registerNavigator = useCallback((navigate: NavigateFunction) => {
    navigatorRef.current = navigate;
  }, []);

  const navigateToPlayer = useCallback((itemId: string) => {
    if (!navigatorRef.current) return;
    navigatorRef.current(`/player/${itemId}`);
  }, []);

  const startExternalFallback = useCallback(async (itemOverride?: WuCinemaMediaItem, resumeOverride?: boolean) => {
    const currentItem = itemOverride || playingItem;
    const resume = typeof resumeOverride === 'boolean' ? resumeOverride : requestedResume;

    if (!session || !currentItem) {
      return;
    }

    try {
      await destroyEngine();

      const settings = getPlaybackSettings();
      const engine = new MpvSidecarEngine();
      engineRef.current = engine;
      setPlaybackEngine(engine);
      setPlaybackMode('fallback');
      setPlaybackState('buffering');

      const mediaSourceId = currentItem.id;
      const streamUrl = getPlaybackStreamUrl(
        session.activeServerUrl || session.serverUrl,
        currentItem.id,
        mediaSourceId,
        settings.preferDirectPlay,
        settings.avoidTranscoding,
      );

      const positionTicks = resume ? currentItem.resumePositionTicks : 0;
      const resumeSeconds = positionTicks / 10000000;
      const cleanTitle = safeMediaDisplayName(currentItem);

      await reportPlaybackStart(session.activeServerUrl || session.serverUrl, session.accessToken, session.userId, {
        ItemId: currentItem.id,
        MediaSourceId: mediaSourceId,
        CanSeek: true,
        PositionTicks: positionTicks
      });

      const subFile = localStorage.getItem(`sub_${currentItem.id}`) || undefined;

      await engine.play(streamUrl, {
        title: cleanTitle,
        resumeSeconds,
        fullscreen: false,
        httpHeader: `Authorization: MediaBrowser Token="${session.accessToken}"`,
        subFile,
      });

      // Determine actual mode after play() resolves (embed flag is set inside play())
      const actualMode = engine.embedMode ? 'embedded' : 'fallback';
      setPlaybackMode(actualMode);
      setPlaybackState('playing');
      setIsPlaying(true);
    } catch (error) {
      setPlaybackState('error');
      throw new Error(sanitizePlaybackError(error));
    }
  }, [destroyEngine, playingItem, requestedResume, session]);

  const startPlayback = async (item: WuCinemaMediaItem, resume: boolean = false) => {
    if (!session) {
      alert('You must be logged in to play media.');
      return;
    }

    try {
      await destroyEngine();
      const settings = getPlaybackSettings();
      setIsPlaying(true);
      setPlayingItem(item);
      setRequestedResume(resume);
      setPlaybackMode('integrated');
      setPlaybackState('buffering');

      navigateToPlayer(item.id);

      if (settings.preferredPlayer === 'external' || (settings.useExternalFallbackWhenUnavailable && integratedStatus !== 'ready')) {
        await startExternalFallback();
      } else if (isEmbedSupported()) {
        await startExternalFallback();
      } else {
        const engine = new LibMpvEmbeddedEngine();
        engineRef.current = engine;
        setPlaybackEngine(engine);

        const mediaSourceId = item.id;
        const streamUrl = getPlaybackStreamUrl(
          session.activeServerUrl || session.serverUrl,
          item.id,
          mediaSourceId,
          settings.preferDirectPlay,
          settings.avoidTranscoding,
        );

        const positionTicks = resume ? item.resumePositionTicks : 0;
        const resumeSeconds = positionTicks / 10000000;
        const cleanTitle = safeMediaDisplayName(item);

        await reportPlaybackStart(session.activeServerUrl || session.serverUrl, session.accessToken, session.userId, {
          ItemId: item.id,
          MediaSourceId: mediaSourceId,
          CanSeek: true,
          PositionTicks: positionTicks
        });

        const subFile = localStorage.getItem(`sub_${item.id}`) || undefined;

        await engine.play(streamUrl, {
          title: cleanTitle,
          resumeSeconds,
          fullscreen: false,
          httpHeader: `Authorization: MediaBrowser Token="${session.accessToken}"`,
          subFile,
        });

        setPlaybackState('playing');
      }
    } catch (e: any) {
      alert(`Playback failed: ${sanitizePlaybackError(e)}`);
      setIsPlaying(false);
      setPlayingItem(null);
      setPlaybackEngine(null);
      setPlaybackMode(null);
      setPlaybackState('error');
    }
  };

  const stopPlayback = async () => {
    if (!session || !playingItem) {
      setIsPlaying(false);
      setPlayingItem(null);
      return;
    }

    let positionTicks = 0;
    if (playbackEngine) {
      try {
        const timePos = playbackEngine.getTimePos();
        positionTicks = Math.floor(timePos * 10000000);
      } catch (e) {
        console.warn('Failed to get final positionTicks from engine', e);
      }
    }

    try {
      if (playbackEngine || playbackMode === 'fallback' || playbackMode === 'embedded') {
        await reportPlaybackStopped(session.activeServerUrl || session.serverUrl, session.accessToken, session.userId, {
          ItemId: playingItem.id,
          MediaSourceId: playingItem.id,
          PositionTicks: positionTicks
        });
      }
    } catch (e) {
      console.error('Failed to report stop', sanitizePlaybackError(e));
    }

    try {
      await destroyEngine();
    } catch (e) {
      console.warn('Error stopping engine:', sanitizePlaybackError(e));
    }
    
    setIsPlaying(false);
    setPlayingItem(null);
    setPlaybackMode(null);
    setPlaybackState('idle');
    setRequestedResume(false);
    setPlaybackEngine(null);
  };

  return (
    <PlaybackContext.Provider value={{
      isPlaying,
      playingItem,
      playbackEngine,
      playbackState,
      playbackMode,
      integratedStatus,
      requestedResume,
      startPlayback,
      startExternalFallback,
      stopPlayback,
      registerNavigator,
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlaybackContext() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlaybackContext must be used within a PlaybackProvider');
  }
  return context;
}
