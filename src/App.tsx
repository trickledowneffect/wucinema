import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlaybackProvider } from './context/PlaybackContext';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import SplashScreen from './components/SplashScreen/SplashScreen';

/**
 * Inner app component that reads auth state.
 * Shows login screen if not authenticated, main app if authenticated.
 */
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Splash is already showing during this window
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <PlaybackProvider>
      <RouterProvider router={router} />
    </PlaybackProvider>
  );
}

import { NotificationProvider } from './context/NotificationContext';

/**
 * Root App component.
 * Shows the splash screen first, then the main app.
 */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      {/* Mount the app underneath immediately so auth check runs during splash */}
      <div style={{ visibility: splashDone ? 'visible' : 'hidden', height: '100%' }}>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </div>
    </>
  );
}
