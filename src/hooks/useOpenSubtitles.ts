import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { OsSubtitleResult } from '../services/subtitles/openSubtitlesTypes';
import {
  search,
  downloadSubtitleText,
  isConfigured,
} from '../services/subtitles/openSubtitlesClient';

export interface UseOpenSubtitlesReturn {
  results: OsSubtitleResult[];
  isLoading: boolean;
  error: string | null;
  notConfigured: boolean;
  downloadedIds: Set<number>;
  download: (fileId: number, filename?: string) => Promise<void>;
}

/**
 * React hook that searches OpenSubtitles v2 for a given movie title / year
 * and provides a download helper.
 */
export function useOpenSubtitles(
  itemId?: string,
  movieTitle?: string,
  movieYear?: number,
  languages: string[] = ['en'],
): UseOpenSubtitlesReturn {
  const [results, setResults] = useState<OsSubtitleResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!movieTitle) return;

    if (!isConfigured()) {
      setNotConfigured(true);
      setResults([]);
      return;
    }

    setNotConfigured(false);

    // Cancel any previous in-flight request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    search({
      query: movieTitle,
      year: movieYear,
      languages: languages.join(','),
      type: 'movie',
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResults(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError((err as Error).message || 'Unknown error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [movieTitle, movieYear, languages.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = useCallback(async (fileId: number, filename?: string) => {
    try {
      const { text, filename: serverFilename } = await downloadSubtitleText(fileId);
      const name = filename || serverFilename || `subtitle-${fileId}.srt`;

      // Check if we are running in Tauri
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const savedPath = await invoke<string>('save_temp_subtitle', { text, filename: name });
        
        if (itemId) {
          localStorage.setItem(`sub_${itemId}`, savedPath);
        }

        // Live inject into running mpv instance if active
        try {
          await invoke('mpv_command', { command: ['sub-add', savedPath, 'select'] });
        } catch {
          // MPV might not be currently active, ignore error
        }
      } else {
        // Fallback: Trigger a browser download via a Blob URL
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDownloadedIds((prev) => new Set(prev).add(fileId));
    } catch (err: unknown) {
      alert(`Subtitle download failed: ${(err as Error).message}`);
    }
  }, [itemId]);

  return { results, isLoading, error, notConfigured, downloadedIds, download };
}
