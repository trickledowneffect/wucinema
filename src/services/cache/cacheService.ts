// ============================================
// WU-CINE Cache Service
// ============================================
// Provides a unified cache layer backed by the Rust filesystem commands.
// Falls back gracefully to in-memory cache when running outside Tauri.
//
// Cache Strategy:
//   metadata_<itemId>.json  → WuCinemaMediaItem JSON (instant detail loads)
//   img_poster_<itemId>.bin → Primary poster image bytes (local img display)
//   img_backdrop_<itemId>.bin → Backdrop image bytes
//   sub_<itemId>_<fileId>.srt → Subtitle files (permanent, not temp)
//   home_<section>.json     → Home screen section lists
//   movies_list.json        → Full movies list
//   shows_list.json         → Full shows list
// ============================================

import { invoke } from '@tauri-apps/api/core';
import type { WuCinemaMediaItem } from '../jellyfin/jellyfinTypes';

// ---- In-memory fallback (non-Tauri browser dev) ----
const memCache = new Map<string, string>();

function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

// ---- Core read/write ----

async function cacheWrite(key: string, content: string): Promise<void> {
  if (isTauri()) {
    await invoke<string>('save_cached_text', { key, content });
  } else {
    memCache.set(key, content);
  }
}

async function cacheRead(key: string): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_cached_text', { key });
    } catch {
      return null;
    }
  } else {
    return memCache.get(key) ?? null;
  }
}

async function cacheBinaryWrite(key: string, data: number[]): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string>('save_cached_binary', { key, data });
    } catch {
      return null;
    }
  }
  return null;
}

export async function cacheGetPath(key: string): Promise<string | null> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_cached_path', { key });
    } catch {
      return null;
    }
  }
  return null;
}

// ---- Metadata cache ----

export async function cacheItemMetadata(item: WuCinemaMediaItem): Promise<void> {
  try {
    const key = `metadata_${item.id}.json`;
    await cacheWrite(key, JSON.stringify(item));
  } catch (err) {
    console.warn('[Cache] Failed to cache metadata:', err);
  }
}

export async function getCachedItemMetadata(itemId: string): Promise<WuCinemaMediaItem | null> {
  try {
    const key = `metadata_${itemId}.json`;
    const raw = await cacheRead(key);
    if (!raw) return null;
    return JSON.parse(raw) as WuCinemaMediaItem;
  } catch {
    return null;
  }
}

export async function cacheItemList(listKey: string, items: WuCinemaMediaItem[]): Promise<void> {
  try {
    await cacheWrite(`${listKey}.json`, JSON.stringify(items));
  } catch (err) {
    console.warn('[Cache] Failed to cache item list:', err);
  }
}

export async function getCachedItemList(listKey: string): Promise<WuCinemaMediaItem[] | null> {
  try {
    const raw = await cacheRead(`${listKey}.json`);
    if (!raw) return null;
    return JSON.parse(raw) as WuCinemaMediaItem[];
  } catch {
    return null;
  }
}

// ---- Image cache ----

/**
 * Download an image URL and cache it as binary on disk.
 * Returns a local file:// path (Tauri) or null (browser).
 */
async function cacheImage(key: string, url: string): Promise<string | null> {
  if (!isTauri() || !url) return null;

  // Check if already cached
  const existing = await cacheGetPath(key);
  if (existing) return existing;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = Array.from(new Uint8Array(buffer));
    const path = await cacheBinaryWrite(key, bytes);
    return path;
  } catch {
    return null;
  }
}

export async function cachePosterImage(itemId: string, url: string | undefined): Promise<string | null> {
  if (!url) return null;
  return cacheImage(`img_poster_${itemId}.bin`, url);
}

export async function cacheBackdropImage(itemId: string, url: string | undefined): Promise<string | null> {
  if (!url) return null;
  return cacheImage(`img_backdrop_${itemId}.bin`, url);
}

export async function getCachedPosterPath(itemId: string): Promise<string | null> {
  return cacheGetPath(`img_poster_${itemId}.bin`);
}

export async function getCachedBackdropPath(itemId: string): Promise<string | null> {
  return cacheGetPath(`img_backdrop_${itemId}.bin`);
}

// ---- Subtitle cache (permanent, not OS temp) ----

export async function cacheSubtitleFile(
  itemId: string,
  fileId: number,
  text: string,
  filename: string,
): Promise<string | null> {
  const key = `sub_${itemId}_${fileId}_${filename}`;
  if (isTauri()) {
    try {
      const path = await invoke<string>('save_cached_text', { key, content: text });
      // Register the path for playback
      localStorage.setItem(`sub_${itemId}`, path);
      return path;
    } catch {
      return null;
    }
  } else {
    // Browser fallback: trigger download
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return null;
  }
}

// ---- Batch prefetch (called after a page loads its item list) ----

/**
 * Prefetch metadata + poster images for a list of items in the background.
 * Uses low priority — runs after a short delay so it doesn't compete with
 * the initial page render.
 */
export async function prefetchItems(items: WuCinemaMediaItem[]): Promise<void> {
  if (!isTauri() || items.length === 0) return;

  // Small delay so the UI renders first
  await new Promise((r) => setTimeout(r, 500));

  // Batch in groups of 4 to avoid flooding the network
  const BATCH = 4;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (item) => {
        // Cache metadata JSON
        await cacheItemMetadata(item);
        // Cache poster image (smaller, higher priority)
        await cachePosterImage(item.id, item.primaryImageUrl);
      })
    );
  }
}

/**
 * Prefetch backdrop images for a smaller set of "hero" items
 * (e.g., spotlight carousel, continue watching).
 */
export async function prefetchBackdrops(items: WuCinemaMediaItem[]): Promise<void> {
  if (!isTauri() || items.length === 0) return;
  await new Promise((r) => setTimeout(r, 800));
  await Promise.allSettled(
    items.slice(0, 6).map((item) => cacheBackdropImage(item.id, item.backdropImageUrl))
  );
}

// ---- Cache management ----

export interface CachedFileInfo {
  key: string;
  size: number;
  modified: number;
  path: string;
  category: 'metadata' | 'poster' | 'backdrop' | 'subtitle' | 'list' | 'other';
}

function categorize(key: string): CachedFileInfo['category'] {
  if (key.startsWith('metadata_')) return 'metadata';
  if (key.startsWith('img_poster_')) return 'poster';
  if (key.startsWith('img_backdrop_')) return 'backdrop';
  if (key.startsWith('sub_')) return 'subtitle';
  if (key.endsWith('_list.json') || key.startsWith('home_') || key.startsWith('movies') || key.startsWith('shows')) return 'list';
  return 'other';
}

export async function listCachedFiles(): Promise<CachedFileInfo[]> {
  if (!isTauri()) return [];
  try {
    const raw = await invoke<Array<{ key: string; size: number; modified: number; path: string }>>('list_cached_files');
    return raw.map((f) => ({ ...f, category: categorize(f.key) }));
  } catch {
    return [];
  }
}

export async function clearAllCache(): Promise<void> {
  if (isTauri()) {
    await invoke('clear_cache');
  }
  memCache.clear();
}

export async function deleteCachedFile(key: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_cached_file', { key });
  } else {
    memCache.delete(key);
  }
}

export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
