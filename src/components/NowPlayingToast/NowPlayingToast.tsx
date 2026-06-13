import { Play, Square } from 'lucide-react';
import { usePlaybackContext } from '../../context/PlaybackContext';
import { safeMediaDisplayName } from '../../services/playback/playbackPrivacy';
import './NowPlayingToast.css';

export default function NowPlayingToast() {
  const { isPlaying, playingItem, stopPlayback, playbackMode, playbackState, integratedStatus } = usePlaybackContext();

  if (!isPlaying || !playingItem) return null;

  const label =
    playbackMode === 'fallback'
      ? 'Fallback external player'
      : integratedStatus === 'ready'
        ? playbackState === 'buffering'
          ? 'Preparing integrated player'
          : 'Integrated player'
        : 'Preparing integrated player';

  return (
    <div className="now-playing-toast">
      <div className="now-playing-info">
        <div className="now-playing-indicator">
          <Play size={14} className="playing-icon" />
        </div>
        <div className="now-playing-text">
          <span className="now-playing-label">{label}</span>
          <span className="now-playing-title">{safeMediaDisplayName(playingItem)}</span>
        </div>
      </div>
      <button className="now-playing-stop-btn" onClick={stopPlayback} title="Stop and Close">
        <Square size={14} /> Stop
      </button>
    </div>
  );
}
