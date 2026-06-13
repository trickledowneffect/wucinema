import { useState, type FormEvent } from 'react';

import { useAuth } from '../../context/AuthContext';
import { validateServerUrl } from '../../services/jellyfin/jellyfinClient';
import { JellyfinError } from '../../services/jellyfin/jellyfinClient';
import { CheckCircleBold, DangerCircleBold, WiFiRouterMinimalisticBold, LoginBold } from 'solar-icon-set';
import type { JellyfinSystemInfo } from '../../services/jellyfin/jellyfinTypes';
import './LoginScreen.css';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [testResult, setTestResult] = useState<
    { success: true; info: JellyfinSystemInfo } | { success: false; message: string } | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    serverUrl?: string;
    username?: string;
    password?: string;
  }>({});

  const { login } = useAuth();
  const isLoading = isTestingConnection || isSigningIn;

  function validateFields(): boolean {
    const errors: typeof fieldErrors = {};
    const urlError = validateServerUrl(serverUrl);
    if (urlError) errors.serverUrl = urlError;
    if (!username.trim()) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateUrlOnly(): boolean {
    const urlError = validateServerUrl(serverUrl);
    if (urlError) {
      setFieldErrors((prev) => ({ ...prev, serverUrl: urlError }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, serverUrl: undefined }));
    return true;
  }

  async function handleTestConnection() {
    if (!validateUrlOnly()) return;
    setIsTestingConnection(true);
    setTestResult(null);
    setError(null);
    try {
      const { getSystemInfo, normalizeServerUrl } = await import(
        '../../services/jellyfin/jellyfinClient'
      );
      const info = await getSystemInfo(normalizeServerUrl(serverUrl));
      if (info._realUrl && info._realUrl !== serverUrl) {
        setServerUrl(info._realUrl);
      }
      setTestResult({ success: true, info });
    } catch (err) {
      const message =
        err instanceof JellyfinError ? err.message : 'Failed to connect to the server.';
      setTestResult({ success: false, message });
    } finally {
      setIsTestingConnection(false);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!validateFields()) return;
    setIsSigningIn(true);
    setError(null);
    setTestResult(null);
    try {
      await login(serverUrl, username.trim(), password);
    } catch (err) {
      const message =
        err instanceof JellyfinError
          ? err.message
          : 'An unexpected error occurred. Please try again.';
      setError(message);
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Film grain overlay */}
      <div className="login-grain" />

      <div className="login-layout">
        {/* Left branding panel */}
        <div className="login-brand">
          <div className="login-brand-inner">
            <img
              src="/wucine_logo.png"
              alt="WU-CINE"
              className="login-brand-logo"
            />
            <img
              src="/wucine_wordmark.png"
              alt="WU-CINE"
              className="login-brand-wordmark"
            />
            <p className="login-brand-tagline">Your personal cinema. Everywhere.</p>

            <div className="login-brand-features">
              <div className="login-feature">
                <span className="login-feature-dot" />
                Stream from your Jellyfin library
              </div>
              <div className="login-feature">
                <span className="login-feature-dot" />
                Offline metadata &amp; poster caching
              </div>
              <div className="login-feature">
                <span className="login-feature-dot" />
                Keyboard-driven media player
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <div className="login-card">
            {/* Card header */}
            <div className="login-card-header">
              <div className="login-card-logo">
                <img src="/wucine_logo.png" alt="WU-CINE logo" className="login-card-logo-img" />
              </div>
              <div>
                <h2 className="login-card-title">Sign in</h2>
                <p className="login-card-subtitle">Connect to your Jellyfin server</p>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="login-error">
                <DangerCircleBold size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="login-form" onSubmit={handleSignIn} noValidate>
              {/* Server URL */}
              <div className="login-field">
                <label className="login-label" htmlFor="server-url">
                  Server URL
                </label>
                <div className="login-input-wrap">
                  <input
                    id="server-url"
                    className={`login-input ${fieldErrors.serverUrl ? 'login-input--error' : ''}`}
                    type="text"
                    placeholder="https://jellyfin.yourserver.com"
                    value={serverUrl}
                    onChange={(e) => {
                      setServerUrl(e.target.value);
                      if (fieldErrors.serverUrl)
                        setFieldErrors((prev) => ({ ...prev, serverUrl: undefined }));
                    }}
                    disabled={isLoading}
                    autoComplete="url"
                  />
                  <button
                    type="button"
                    className={`login-test-btn ${isTestingConnection ? 'login-test-btn--loading' : ''}`}
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    title="Test connection"
                    aria-label="Test server connection"
                  >
                    {isTestingConnection ? (
                      <span className="login-spinner" />
                    ) : (
                      <WiFiRouterMinimalisticBold size={16} />
                    )}
                  </button>
                </div>
                {fieldErrors.serverUrl && (
                  <span className="login-field-error">{fieldErrors.serverUrl}</span>
                )}
                {/* Connection result inline */}
                {testResult && (
                  <div
                    className={`login-test-result ${
                      testResult.success
                        ? 'login-test-result--success'
                        : 'login-test-result--error'
                    }`}
                  >
                    {testResult.success ? (
                      <>
                        <CheckCircleBold size={13} />
                        <span>
                          Connected to <strong>{testResult.info.ServerName}</strong> v{testResult.info.Version}
                        </span>
                      </>
                    ) : (
                      <>
                        <DangerCircleBold size={13} />
                        <span>{testResult.message}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="login-field">
                <label className="login-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className={`login-input ${fieldErrors.username ? 'login-input--error' : ''}`}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username)
                      setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  disabled={isLoading}
                  autoComplete="username"
                />
                {fieldErrors.username && (
                  <span className="login-field-error">{fieldErrors.username}</span>
                )}
              </div>

              {/* Password */}
              <div className="login-field">
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className={`login-input ${fieldErrors.password ? 'login-input--error' : ''}`}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {fieldErrors.password && (
                  <span className="login-field-error">{fieldErrors.password}</span>
                )}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                aria-label="Sign in"
              >
                {isSigningIn ? (
                  <>
                    <div className="app-loading-spinner search-screen-empty-icon" style={{ width: 40, height: 40 }} />
                    Signing In…
                  </>
                ) : (
                  <>
                    <LoginBold size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="login-footer">
              WU-CINE connects directly to your Jellyfin server.
              <br />No account or cloud service required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
