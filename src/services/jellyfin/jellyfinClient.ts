// ============================================
// Jellyfin REST API client
// ============================================

import type {
  JellyfinSystemInfo,
  JellyfinAuthResponse,
  JellyfinUser,
  JellyfinUserViewsResponse,
  JellyfinItem,
  JellyfinItemsResponse,
} from './jellyfinTypes';

const CLIENT_NAME = 'WU-CINE';
const CLIENT_VERSION = '0.1.0';
const DEVICE_NAME = 'Windows Desktop';
const REQUEST_TIMEOUT_MS = 10_000;

// ---- URL helpers ----

/**
 * Normalize a server URL:
 * - Trim whitespace
 * - Auto-prepend https:// if no protocol is given
 * - Remove trailing slashes
 */
export function normalizeServerUrl(url: string): string {
  let normalized = url.trim();

  // Auto-prepend http:// if the user didn't type a protocol
  if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `http://${normalized}`;
  }

  // Strip trailing slashes
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Validate that a URL looks like a valid Jellyfin server URL.
 * Returns an error string or null if valid.
 */
export function validateServerUrl(url: string): string | null {
  if (!url.trim()) {
    return 'Server URL is required';
  }

  const normalized = normalizeServerUrl(url);

  try {
    new URL(normalized);
  } catch {
    return 'Server URL is not a valid URL';
  }

  return null;
}

// ---- Auth header ----

/**
 * Build the Jellyfin authorization header value.
 * Format: MediaBrowser Client="WU-CINE", Device="...", DeviceId="...", Version="...", Token="..."
 */
export function buildAuthHeader(deviceId: string, accessToken?: string): string {
  const parts = [
    `Client="${CLIENT_NAME}"`,
    `Device="${DEVICE_NAME}"`,
    `DeviceId="${deviceId}"`,
    `Version="${CLIENT_VERSION}"`,
  ];

  if (accessToken) {
    parts.push(`Token="${accessToken}"`);
  }

  return `MediaBrowser ${parts.join(', ')}`;
}

// ---- Fetch wrapper ----

/**
 * Make a fetch request with timeout and error normalization.
 */
async function jellyfinFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new JellyfinError('Connection timed out. Is the server reachable?', 'TIMEOUT');
    }
    if (err instanceof TypeError) {
      // Network errors (CORS, DNS, refused, etc.)
      throw new JellyfinError(
        'Cannot reach the server. Check the URL and make sure the server is running.',
        'NETWORK',
      );
    }
    throw new JellyfinError(
      'An unexpected error occurred while connecting to the server.',
      'UNKNOWN',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---- Error class ----

export type JellyfinErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'AUTH'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class JellyfinError extends Error {
  code: JellyfinErrorCode;

  constructor(message: string, code: JellyfinErrorCode) {
    super(message);
    this.name = 'JellyfinError';
    this.code = code;
  }
}

// ---- API functions ----

/**
 * Test the server connection by fetching public system info.
 * GET /System/Info/Public
 * This endpoint does NOT require authentication.
 */
export async function getSystemInfo(serverUrl: string): Promise<JellyfinSystemInfo & { _realUrl?: string }> {
  const url = `${normalizeServerUrl(serverUrl)}/System/Info/Public`;

  const response = await jellyfinFetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new JellyfinError(
        'Server responded but does not appear to be a Jellyfin server.',
        'NOT_FOUND',
      );
    }
    throw new JellyfinError(
      `Server returned an error (HTTP ${response.status}).`,
      'SERVER_ERROR',
    );
  }

  try {
    const data = await response.json();

    // Validate the response has the expected shape
    if (typeof data.ServerName !== 'string' || typeof data.Version !== 'string') {
      throw new JellyfinError(
        'Server responded but the response does not look like Jellyfin.',
        'INVALID_RESPONSE',
      );
    }

    // Determine the real URL after any redirects (e.g. HTTP -> HTTPS)
    let _realUrl: string | undefined;
    if (response.url) {
      const suffix = '/System/Info/Public';
      if (response.url.toLowerCase().endsWith(suffix.toLowerCase())) {
        _realUrl = response.url.slice(0, response.url.length - suffix.length);
      } else if (response.url.toLowerCase().endsWith(suffix.toLowerCase() + '/')) {
        _realUrl = response.url.slice(0, response.url.length - suffix.length - 1);
      }
    }

    return { ...data, _realUrl } as JellyfinSystemInfo & { _realUrl?: string };
  } catch (err) {
    if (err instanceof JellyfinError) throw err;
    throw new JellyfinError(
      'Server responded but returned invalid data.',
      'INVALID_RESPONSE',
    );
  }
}

/**
 * Authenticate with username and password.
 * POST /Users/AuthenticateByName
 */
export async function authenticate(
  serverUrl: string,
  username: string,
  password: string,
  deviceId: string,
): Promise<JellyfinAuthResponse> {
  const url = `${normalizeServerUrl(serverUrl)}/Users/AuthenticateByName`;

  const response = await jellyfinFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': buildAuthHeader(deviceId),
    },
    body: JSON.stringify({
      Username: username,
      Pw: password,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new JellyfinError(
        'Invalid username or password.',
        'AUTH',
      );
    }
    if (response.status === 403) {
      throw new JellyfinError(
        'Access denied. Your account may be disabled.',
        'AUTH',
      );
    }
    throw new JellyfinError(
      `Authentication failed (HTTP ${response.status}).`,
      'SERVER_ERROR',
    );
  }

  try {
    const data = await response.json();

    if (!data.AccessToken || !data.User?.Id) {
      throw new JellyfinError(
        'Server authenticated but returned an unexpected response.',
        'INVALID_RESPONSE',
      );
    }

    return data as JellyfinAuthResponse;
  } catch (err) {
    if (err instanceof JellyfinError) throw err;
    throw new JellyfinError(
      'Authentication response was invalid.',
      'INVALID_RESPONSE',
    );
  }
}

/**
 * Get the current user profile.
 * GET /Users/{userId}
 */
export async function getCurrentUser(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
): Promise<JellyfinUser> {
  const url = `${normalizeServerUrl(serverUrl)}/Users/${userId}`;

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new JellyfinError('Session expired. Please log in again.', 'AUTH');
    }
    throw new JellyfinError(
      `Failed to fetch user profile (HTTP ${response.status}).`,
      'SERVER_ERROR',
    );
  }

  try {
    const data = await response.json();
    return data as JellyfinUser;
  } catch {
    throw new JellyfinError('User profile response was invalid.', 'INVALID_RESPONSE');
  }
}

/**
 * Get the user's library views (Movies, TV Shows, etc.).
 * GET /Users/{userId}/Views
 */
export async function getUserViews(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
): Promise<JellyfinUserViewsResponse> {
  const url = `${normalizeServerUrl(serverUrl)}/Users/${userId}/Views`;

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new JellyfinError('Session expired. Please log in again.', 'AUTH');
    }
    throw new JellyfinError(
      `Failed to fetch libraries (HTTP ${response.status}).`,
      'SERVER_ERROR',
    );
  }

  try {
    const data = await response.json();

    if (!Array.isArray(data.Items)) {
      throw new JellyfinError('Libraries response was invalid.', 'INVALID_RESPONSE');
    }

    return data as JellyfinUserViewsResponse;
  } catch (err) {
    if (err instanceof JellyfinError) throw err;
    throw new JellyfinError('Libraries response was invalid.', 'INVALID_RESPONSE');
  }
}

// ============================================
// Phase 3: Library & Item Fetching
// ============================================

/**
 * Get items from the Jellyfin library.
 * GET /Users/{userId}/Items
 */
export async function getItems(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  options?: {
    parentId?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'Ascending' | 'Descending';
    filters?: string; // e.g. "IsUnplayed", "IsPlayed"
    fields?: string; // e.g. "Overview,MediaSources,MediaStreams"
    limit?: number;
    startIndex?: number;
    recursive?: boolean;
    includeItemTypes?: string; // e.g. "Movie,Series"
  }
): Promise<JellyfinItemsResponse> {
  let url = `${normalizeServerUrl(serverUrl)}/Users/${userId}/Items`;
  
  const params = new URLSearchParams();
  if (options?.parentId) params.append('ParentId', options.parentId);
  if (options?.searchTerm) params.append('SearchTerm', options.searchTerm);
  if (options?.sortBy) params.append('SortBy', options.sortBy);
  if (options?.sortOrder) params.append('SortOrder', options.sortOrder);
  if (options?.filters) params.append('Filters', options.filters);
  if (options?.fields) params.append('Fields', options.fields);
  if (options?.limit) params.append('Limit', options.limit.toString());
  if (options?.startIndex !== undefined) params.append('StartIndex', options.startIndex.toString());
  if (options?.recursive !== undefined) params.append('Recursive', options.recursive.toString());
  if (options?.includeItemTypes) params.append('IncludeItemTypes', options.includeItemTypes);

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    throw new JellyfinError(`Failed to fetch items (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItemsResponse>;
}

/**
 * Get resume/continue watching items for a user.
 * GET /Users/{userId}/Items/Resume
 */
export async function getResumeItems(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  limit: number = 12
): Promise<JellyfinItemsResponse> {
  const url = `${normalizeServerUrl(serverUrl)}/Users/${userId}/Items/Resume?Limit=${limit}&Fields=Overview,MediaSources,MediaStreams`;
  
  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    throw new JellyfinError(`Failed to fetch resume items (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItemsResponse>;
}

/**
 * Get latest added items.
 * GET /Users/{userId}/Items/Latest
 */
export async function getLatestItems(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  parentId?: string,
  limit: number = 16,
  includeItemTypes?: string
): Promise<JellyfinItem[]> {
  let url = `${normalizeServerUrl(serverUrl)}/Users/${userId}/Items/Latest?Limit=${limit}&Fields=Overview,MediaSources,MediaStreams`;
  if (parentId) {
    url += `&ParentId=${parentId}`;
  }
  if (includeItemTypes) {
    url += `&IncludeItemTypes=${includeItemTypes}`;
  }

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    throw new JellyfinError(`Failed to fetch latest items (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItem[]>;
}

/**
 * Get details for a single item.
 * GET /Users/{userId}/Items/{itemId}
 */
export async function getItemDetails(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  itemId: string
): Promise<JellyfinItem> {
  const fields = 'People,Overview,MediaSources,MediaStreams,Genres,ImageTags,BackdropImageTags';
  const url = `${normalizeServerUrl(serverUrl)}/Users/${userId}/Items/${itemId}?Fields=${encodeURIComponent(fields)}`;

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
       throw new JellyfinError('Item not found', 'NOT_FOUND');
    }
    throw new JellyfinError(`Failed to fetch item details (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItem>;
}

/**
 * Get seasons for a show.
 * GET /Shows/{showId}/Seasons
 */
export async function getSeasons(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  showId: string
): Promise<JellyfinItemsResponse> {
  const url = `${normalizeServerUrl(serverUrl)}/Shows/${showId}/Seasons?UserId=${userId}&Fields=Overview,ImageTags,BackdropImageTags`;
  
  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    throw new JellyfinError(`Failed to fetch seasons (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItemsResponse>;
}

/**
 * Get episodes for a show, optionally filtered by seasonId.
 * GET /Shows/{showId}/Episodes
 */
export async function getEpisodes(
  serverUrl: string,
  accessToken: string,
  userId: string,
  deviceId: string,
  showId: string,
  options?: {
    seasonId?: string;
    seasonNumber?: number;
  }
): Promise<JellyfinItemsResponse> {
  const params = new URLSearchParams();
  params.append('UserId', userId);
  params.append('Fields', 'Overview,MediaSources,MediaStreams,ImageTags,BackdropImageTags');
  if (options?.seasonId) params.append('SeasonId', options.seasonId);
  if (options?.seasonNumber !== undefined) params.append('Season', options.seasonNumber.toString());

  const url = `${normalizeServerUrl(serverUrl)}/Shows/${showId}/Episodes?${params.toString()}`;

  const response = await jellyfinFetch(url, {
    headers: {
      'Authorization': buildAuthHeader(deviceId, accessToken),
    },
  });

  if (!response.ok) {
    throw new JellyfinError(`Failed to fetch episodes (HTTP ${response.status})`, 'SERVER_ERROR');
  }

  return response.json() as Promise<JellyfinItemsResponse>;
}
