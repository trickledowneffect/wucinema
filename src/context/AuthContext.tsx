// ============================================
// Auth context — app-level authentication state
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import type {
  AppSession,
  ConnectionStatus,
  JellyfinSystemInfo,
  JellyfinUserView,
} from '../services/jellyfin/jellyfinTypes';

import {
  getSystemInfo,
  authenticate,
  getUserViews,
  normalizeServerUrl,
  JellyfinError,
} from '../services/jellyfin/jellyfinClient';

import {
  saveSession,
  loadSession,
  clearSession,
} from '../services/settings/sessionService';

import { getDeviceId } from '../utils/deviceId';

// ---- Context shape ----

interface AuthContextValue {
  /** Current session (null if not logged in) */
  session: AppSession | null;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** True while checking for a saved session on app startup */
  isLoading: boolean;

  /** Current connection status to the Jellyfin server */
  connectionStatus: ConnectionStatus;

  /** Detected Jellyfin libraries after login */
  libraries: JellyfinUserView[];

  /** Test a server URL connection. Returns system info on success. */
  testConnection: (serverUrl: string) => Promise<JellyfinSystemInfo>;

  /** Log in with credentials. On success, saves session and fetches libraries. */
  login: (
    serverUrl: string,
    username: string,
    password: string,
  ) => Promise<void>;

  /** Log out — clears session and resets state. */
  logout: () => void;

  /** Re-check connection to the saved server (background validation). */
  refreshConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isDemoSession(session: AppSession): boolean {
  return session.accessToken === 'demo-token' || session.serverName === 'Demo Server';
}

// ---- Provider component ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [libraries, setLibraries] = useState<JellyfinUserView[]>([]);

  // ---- On mount: load saved session ----
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
      if (isDemoSession(saved)) {
        setConnectionStatus('connected');
        setIsLoading(false);
        return;
      }
      // Validate in background — don't block the UI
      validateSession(saved);
    }
    setIsLoading(false);
  }, []);

  // ---- Background validation ----
  async function validateSession(s: AppSession) {
    if (isDemoSession(s)) {
      setConnectionStatus('connected');
      return;
    }

    setConnectionStatus('checking');
    try {
      await getSystemInfo(s.activeServerUrl);
      setConnectionStatus('connected');

      // Also fetch libraries in background
      try {
        const views = await getUserViews(
          s.activeServerUrl,
          s.accessToken,
          s.userId,
          s.deviceId,
        );
        setLibraries(views.Items);
      } catch {
        // Non-fatal — libraries might fail but server is reachable
        console.warn('[Auth] Failed to fetch libraries during validation');
      }
    } catch {
      // Server unreachable — keep session but show warning
      setConnectionStatus('disconnected');
      console.warn('[Auth] Server validation failed — showing disconnected status');
    }
  }

  // ---- Test connection ----
  const testConnection = useCallback(async (serverUrl: string) => {
    const normalized = normalizeServerUrl(serverUrl);
    const info = await getSystemInfo(normalized);
    return info;
  }, []);

  // ---- Login ----
  const login = useCallback(async (
    serverUrl: string,
    username: string,
    password: string,
  ) => {
    const normalized = normalizeServerUrl(serverUrl);
    const deviceId = getDeviceId();

    // First, get system info to verify it's a Jellyfin server
    const systemInfo = await getSystemInfo(normalized);

    // If the server redirected us (e.g. HTTP to HTTPS or added a base path),
    // we MUST use the resolved real URL for the POST request, otherwise
    // the browser might send a GET to the redirected URL, causing a 405 error.
    const realUrl = systemInfo._realUrl || normalized;

    // Authenticate
    const authResponse = await authenticate(realUrl, username, password, deviceId);

    // Build session
    const newSession: AppSession = {
      serverUrl: realUrl,
      activeServerUrl: realUrl,
      serverId: systemInfo.Id,
      serverName: systemInfo.ServerName,
      serverVersion: systemInfo.Version,
      accessToken: authResponse.AccessToken,
      userId: authResponse.User.Id,
      username: authResponse.User.Name,
      deviceId,
      lastConnectedAt: new Date().toISOString(),
    };

    // Save and update state
    saveSession(newSession);
    setSession(newSession);
    setConnectionStatus('connected');

    // Fetch libraries
    try {
      const views = await getUserViews(
        normalized,
        authResponse.AccessToken,
        authResponse.User.Id,
        deviceId,
      );
      setLibraries(views.Items);
    } catch (err) {
      // Non-fatal — login succeeded, libraries just failed to load
      console.warn('[Auth] Login succeeded but failed to fetch libraries:', err);
    }
  }, []);

  // ---- Logout ----
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setConnectionStatus('disconnected');
    setLibraries([]);
  }, []);

  // ---- Refresh connection ----
  const refreshConnection = useCallback(async () => {
    if (!session) return;

    if (isDemoSession(session)) {
      setConnectionStatus('connected');
      return;
    }

    setConnectionStatus('checking');
    try {
      await getSystemInfo(session.activeServerUrl);
      setConnectionStatus('connected');

      // Update last connected time
      const updated = { ...session, lastConnectedAt: new Date().toISOString() };
      saveSession(updated);
      setSession(updated);

      // Refresh libraries
      try {
        const views = await getUserViews(
          session.activeServerUrl,
          session.accessToken,
          session.userId,
          session.deviceId,
        );
        setLibraries(views.Items);
      } catch {
        console.warn('[Auth] Failed to refresh libraries');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      if (err instanceof JellyfinError && err.code === 'AUTH') {
        // Token expired — clear session
        clearSession();
        setSession(null);
        setLibraries([]);
      }
    }
  }, [session]);

  // ---- Context value ----
  const value: AuthContextValue = {
    session,
    isAuthenticated: session !== null,
    isLoading,
    connectionStatus,
    libraries,
    testConnection,
    login,
    logout,
    refreshConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---- Hook ----

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
