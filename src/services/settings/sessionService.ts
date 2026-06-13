// ============================================
// Session persistence (localStorage)
// ============================================
// TODO: Replace localStorage with Tauri secure storage (tauri-plugin-store
// or OS keychain) for access tokens in production. localStorage is fine
// for Phase 2 development but tokens should not live in plaintext long-term.

import type { AppSession } from '../jellyfin/jellyfinTypes';

const SESSION_KEY = 'wucinema_session';

/**
 * Save the current session to localStorage.
 */
export function saveSession(session: AppSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('[SessionService] Failed to save session:', err);
  }
}

/**
 * Load a previously saved session from localStorage.
 * Returns null if no session exists or if the data is corrupted.
 */
export function loadSession(): AppSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Basic shape validation — make sure critical fields exist
    if (
      typeof parsed.serverUrl === 'string' &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.userId === 'string' &&
      typeof parsed.username === 'string' &&
      typeof parsed.deviceId === 'string'
    ) {
      return parsed as AppSession;
    }

    console.warn('[SessionService] Saved session has invalid shape, discarding');
    return null;
  } catch (err) {
    console.error('[SessionService] Failed to load session:', err);
    return null;
  }
}

/**
 * Clear the saved session (logout).
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('[SessionService] Failed to clear session:', err);
  }
}
