import { useState } from 'react';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  Wifi,
  Globe,
  Activity,
  Library,
  LogOut,
  RefreshCw,
  User,
} from 'lucide-react';
import './ServerScreen.css';

/** Format an ISO date string to a human-readable relative/absolute time */
function formatLastConnected(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** Map Jellyfin collection type to a friendly label */
function formatCollectionType(type?: string): string {
  if (!type) return 'Library';
  const map: Record<string, string> = {
    movies: 'Movies',
    tvshows: 'TV Shows',
    boxsets: 'Collections',
    music: 'Music',
    musicvideos: 'Music Videos',
    homevideos: 'Home Videos',
    books: 'Books',
    playlists: 'Playlists',
    livetv: 'Live TV',
    folders: 'Folders',
  };
  return map[type] || type;
}

export default function ServerScreen() {
  const {
    session,
    connectionStatus,
    libraries,
    refreshConnection,
    logout,
  } = useAuth();

  const [isTesting, setIsTesting] = useState(false);

  async function handleTestConnection() {
    setIsTesting(true);
    try {
      await refreshConnection();
    } finally {
      setIsTesting(false);
    }
  }

  const statusDotClass =
    connectionStatus === 'connected'
      ? 'server-status-dot--connected'
      : connectionStatus === 'checking'
        ? 'server-status-dot--checking'
        : 'server-status-dot--disconnected';

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'checking'
        ? 'Checking...'
        : 'Disconnected';

  return (
    <div className="server-screen">
      <h1 className="server-title">Server</h1>
      <p className="server-subtitle">Jellyfin server connection and status</p>

      <div className="server-grid">
        {/* Connection Status */}
        <div className="server-card">
          <h2 className="server-card-title">
            <Wifi className="server-card-title-icon" size={20} />
            Connection Status
          </h2>
          <div className="server-info-row">
            <span className="server-info-label">Status</span>
            <span className="server-info-value">
              <span className={`server-status-dot ${statusDotClass}`} />
              {statusLabel}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Server Name</span>
            <span className="server-info-value">
              {session?.serverName || '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Active Route</span>
            <span className="server-info-value">
              {session?.activeServerUrl
                ? session.activeServerUrl === session.localServerUrl
                  ? 'Local'
                  : 'Primary'
                : '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Last Connected</span>
            <span className="server-info-value">
              {session?.lastConnectedAt
                ? formatLastConnected(session.lastConnectedAt)
                : '—'}
            </span>
          </div>
          <div className="server-actions-row">
            <Button
              variant="secondary"
              size="sm"
              ariaLabel="Test connection"
              onClick={handleTestConnection}
            >
              {isTesting ? (
                <>
                  <RefreshCw size={14} className="server-spin" /> Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Test Connection
                </>
              )}
            </Button>
            <Button
              variant="danger"
              size="sm"
              ariaLabel="Logout"
              onClick={logout}
            >
              <LogOut size={14} /> Logout
            </Button>
          </div>
        </div>

        {/* Server Addresses */}
        <div className="server-card">
          <h2 className="server-card-title">
            <Globe className="server-card-title-icon" size={20} />
            Server Addresses
          </h2>
          <div className="server-info-row">
            <span className="server-info-label">Connection Profile</span>
            <span className="server-info-value">
              {session?.localServerUrl && session?.remoteServerUrl ? 'Local + Remote' : 'Primary only'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Connection Target</span>
            <Badge variant="success">
              {session?.activeServerUrl === session?.localServerUrl
                ? 'Local'
                : 'Primary'}
            </Badge>
          </div>
        </div>

        {/* Server Info */}
        <div className="server-card">
          <h2 className="server-card-title">
            <Activity className="server-card-title-icon" size={20} />
            Server Info
          </h2>
          <div className="server-info-row">
            <span className="server-info-label">Jellyfin Version</span>
            <span className="server-info-value">
              {session?.serverVersion || '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Server ID</span>
            <span className="server-info-value server-info-value--mono server-info-value--truncate">
              {session?.serverId || '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Libraries</span>
            <span className="server-info-value">{libraries.length}</span>
          </div>
        </div>

        {/* User Info */}
        <div className="server-card">
          <h2 className="server-card-title">
            <User className="server-card-title-icon" size={20} />
            Logged In As
          </h2>
          <div className="server-info-row">
            <span className="server-info-label">Username</span>
            <span className="server-info-value">
              {session?.username || '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">User ID</span>
            <span className="server-info-value server-info-value--mono server-info-value--truncate">
              {session?.userId || '—'}
            </span>
          </div>
          <div className="server-info-row">
            <span className="server-info-label">Device ID</span>
            <span className="server-info-value server-info-value--mono server-info-value--truncate">
              {session?.deviceId || '—'}
            </span>
          </div>
        </div>

        {/* Libraries — full width */}
        <div className="server-card server-card--full">
          <h2 className="server-card-title">
            <Library className="server-card-title-icon" size={20} />
            Detected Libraries
          </h2>
          {libraries.length === 0 ? (
            <div className="server-libraries-empty">
              {connectionStatus === 'checking'
                ? 'Loading libraries...'
                : 'No libraries detected. Connect to a server to see your libraries.'}
            </div>
          ) : (
            <div className="server-libraries-grid">
              {libraries.map((lib) => (
                <div key={lib.Id} className="server-library-item">
                  <div className="server-library-icon">
                    <Library size={18} />
                  </div>
                  <div className="server-library-info">
                    <div className="server-library-name">{lib.Name}</div>
                    <div className="server-library-type">
                      {formatCollectionType(lib.CollectionType)}
                    </div>
                  </div>
                  <span className="server-library-id">{lib.Id.slice(0, 8)}…</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
