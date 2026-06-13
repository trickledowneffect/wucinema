import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaybackContext } from '../../context/PlaybackContext';

export default function PlaybackNavigationBridge() {
  const navigate = useNavigate();
  const { registerNavigator } = usePlaybackContext();

  useEffect(() => {
    registerNavigator(navigate);
  }, [navigate, registerNavigator]);

  return null;
}
