/**
 * WuCinema — OpenSubtitles Proxy Worker
 *
 * This Cloudflare Worker sits between WuCinema and api.opensubtitles.com.
 * It injects the API key (stored as a Cloudflare Secret, never in source)
 * so the key is never exposed in the app binary or GitHub.
 *
 * Secrets required (set via: npx wrangler secret put OS_API_KEY):
 *   OS_API_KEY  — your OpenSubtitles API key
 *
 * The worker transparently proxies all paths:
 *   POST   /login        → POST   https://api.opensubtitles.com/api/v1/login
 *   GET    /subtitles?…  → GET    https://api.opensubtitles.com/api/v1/subtitles?…
 *   POST   /download     → POST   https://api.opensubtitles.com/api/v1/download
 *   DELETE /logout       → DELETE https://api.opensubtitles.com/api/v1/logout
 */

const OS_API_BASE = 'https://api.opensubtitles.com/api/v1';
const APP_USER_AGENT = 'WuCinema v0.1.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    // ── CORS preflight ──────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Build the upstream URL ──────────────────────────────────────────────
    const incomingUrl = new URL(request.url);
    const upstreamUrl = `${OS_API_BASE}${incomingUrl.pathname}${incomingUrl.search}`;

    // ── Build upstream headers ──────────────────────────────────────────────
    // Inject the API key from Cloudflare Secrets (env.OS_API_KEY).
    // Pass through the user's Authorization header (their personal JWT, if any).
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Api-Key', env.OS_API_KEY);
    upstreamHeaders.set('User-Agent', APP_USER_AGENT);
    upstreamHeaders.set('Content-Type', 'application/json');

    const auth = request.headers.get('Authorization');
    if (auth) {
      upstreamHeaders.set('Authorization', auth);
    }

    // ── Forward the request ─────────────────────────────────────────────────
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    let upstreamResponse;
    try {
      upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body: hasBody ? request.body : null,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy failed to reach OpenSubtitles', detail: String(err) }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      );
    }

    // ── Return the response with CORS headers added ─────────────────────────
    const responseHeaders = new Headers(upstreamResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
