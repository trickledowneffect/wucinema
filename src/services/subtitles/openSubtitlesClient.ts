// ============================================
// OpenSubtitles REST API v2 — Client
// https://opensubtitles.stoplight.io/docs/opensubtitles-api
//
// All requests go through the WU-CINE Cloudflare Worker proxy.
// The worker injects the API key server-side (stored as a Cloudflare Secret).
// No API key is present in this file or anywhere in the built binary.
//
// Set VITE_OS_PROXY_URL in .env.local after deploying the worker:
//   VITE_OS_PROXY_URL=https://wucinema-subtitle-proxy.<your-subdomain>.workers.dev
//
// User JWT (for >5 downloads/day quota) is still stored client-side in
// localStorage — it only identifies the user's OS account, not the app key.
// ============================================

import type {
  OsLoginResponse,
  OsSearchResponse,
  OsSubtitleResult,
  OsDownloadResponse,
} from './openSubtitlesTypes';

// Base URL — uses the Cloudflare Worker proxy when deployed, else direct API.
const BASE_URL: string =
  (import.meta.env.VITE_OS_PROXY_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://api.opensubtitles.com/api/v1';

const IS_PROXIED = !!(import.meta.env.VITE_OS_PROXY_URL as string | undefined);
// Fallback: API key baked in at build time (gitignored .env.local)
const BUILT_IN_API_KEY: string = (import.meta.env.VITE_OS_API_KEY as string) || '';

// ---- Storage keys ----------------------------------------------------------

const KEY_USERNAME = 'osUsername';
const KEY_PASSWORD = 'osPassword';
const KEY_TOKEN    = 'osJwt';
const KEY_TOKEN_TS = 'osJwtTimestamp';

// ---- Credential helpers ----------------------------------------------------

export function getStoredCredentials(): { username: string; password: string } {
  return {
    username: localStorage.getItem(KEY_USERNAME) || '',
    password: localStorage.getItem(KEY_PASSWORD) || '',
  };
}

export function setStoredCredentials(username: string, password: string): void {
  localStorage.setItem(KEY_USERNAME, username);
  localStorage.setItem(KEY_PASSWORD, password);
}

// ---- JWT helpers -----------------------------------------------------------

function getStoredToken(): string | null {
  const token = localStorage.getItem(KEY_TOKEN);
  const ts = parseInt(localStorage.getItem(KEY_TOKEN_TS) || '0', 10);
  if (!token || !ts) return null;
  // Tokens are valid for 24h; refresh after 23h to be safe.
  if (Date.now() - ts > 23 * 60 * 60 * 1000) {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_TOKEN_TS);
    return null;
  }
  return token;
}

function storeToken(token: string): void {
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_TOKEN_TS, String(Date.now()));
}

function clearToken(): void {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_TOKEN_TS);
}

// ---- HTTP helper -----------------------------------------------------------

/**
 * Build request headers.
 * When using the proxy: NO Api-Key header (the worker adds it server-side).
 * When falling back to direct API: we can't authenticate — searches will work
 * anonymously (5 downloads/day) until the proxy is deployed.
 */
function buildHeaders(jwt?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // When NOT going through the proxy, inject the baked-in key directly.
  if (!IS_PROXIED && BUILT_IN_API_KEY) {
    headers['Api-Key'] = BUILT_IN_API_KEY;
    headers['User-Agent'] = 'WU-CINE v0.1.0';
  }
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }
  return headers;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit,
  jwt?: string | null,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(jwt),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`OpenSubtitles ${IS_PROXIED ? 'proxy' : 'API'} error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---- Public API ------------------------------------------------------------

/**
 * Log in with the user's OpenSubtitles credentials.
 * Optional — raises download quota from 5/day (anonymous) to 20/day.
 */
export async function login(username?: string, password?: string): Promise<string> {
  const creds = {
    username: username ?? getStoredCredentials().username,
    password: password ?? getStoredCredentials().password,
  };

  if (!creds.username || !creds.password) {
    throw new Error('Username and password are required to log in.');
  }

  const data = await apiFetch<OsLoginResponse>(
    '/login',
    { method: 'POST', body: JSON.stringify(creds) },
  );

  storeToken(data.token);
  return data.token;
}

/**
 * Log out — deletes the stored JWT.
 */
export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await apiFetch('/logout', { method: 'DELETE' }, token);
    } catch {
      // ignore logout errors
    }
  }
  clearToken();
}

export interface SubtitleSearchParams {
  query?: string;
  imdb_id?: number;
  tmdb_id?: number;
  languages?: string;   // comma-separated ISO 639-1, e.g. "en,es,fr"
  year?: number;
  type?: 'movie' | 'episode' | 'all';
  page?: number;
}

/**
 * Search for subtitles.
 * Automatically attaches the user JWT if one is stored (higher quota).
 */
export async function search(params: SubtitleSearchParams): Promise<OsSubtitleResult[]> {
  // Try to use a cached JWT; refresh from credentials if expired.
  let jwt = getStoredToken();
  if (!jwt) {
    const { username, password } = getStoredCredentials();
    if (username && password) {
      try { jwt = await login(username, password); } catch { jwt = null; }
    }
  }

  const qs = new URLSearchParams();
  if (params.query)     qs.set('query', params.query);
  if (params.imdb_id)   qs.set('imdb_id', String(params.imdb_id));
  if (params.tmdb_id)   qs.set('tmdb_id', String(params.tmdb_id));
  if (params.languages) qs.set('languages', params.languages);
  if (params.year)      qs.set('year', String(params.year));
  if (params.type)      qs.set('type', params.type);
  if (params.page)      qs.set('page', String(params.page));

  const data = await apiFetch<OsSearchResponse>(
    `/subtitles?${qs.toString()}`,
    { method: 'GET' },
    jwt,
  );

  return data.data;
}

/**
 * Request a temporary download link for a subtitle file_id.
 */
export async function requestDownload(fileId: number): Promise<OsDownloadResponse> {
  let jwt = getStoredToken();
  if (!jwt) {
    const { username, password } = getStoredCredentials();
    if (username && password) {
      try { jwt = await login(username, password); } catch { jwt = null; }
    }
  }

  return apiFetch<OsDownloadResponse>(
    '/download',
    { method: 'POST', body: JSON.stringify({ file_id: fileId }) },
    jwt,
  );
}

/**
 * Download the subtitle file and return its text content.
 */
export async function downloadSubtitleText(fileId: number): Promise<{ text: string; filename: string }> {
  const info = await requestDownload(fileId);
  const res = await fetch(info.link);
  if (!res.ok) throw new Error(`Failed to download subtitle file: ${res.statusText}`);
  const text = await res.text();
  return { text, filename: info.file_name };
}

/**
 * True if subtitle search will work.
 * Either the proxy URL is set (production) or the built-in key is present (dev).
 */
export function isConfigured(): boolean {
  return IS_PROXIED || !!BUILT_IN_API_KEY;
}
