'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RankedListLength } from './types';

const STORAGE_KEY = 'druthers:ranked-list-length';
const DEFAULT_LENGTH: RankedListLength = '25';

function isLength(value: unknown): value is RankedListLength {
  return value === '25' || value === '50' || value === '100' || value === 'all';
}

function readLocal(): RankedListLength {
  if (typeof window === 'undefined') return DEFAULT_LENGTH;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isLength(raw) ? raw : DEFAULT_LENGTH;
}

/**
 * Viewer-controlled ranked list length (#122): 25/50/100/all, remembered
 * across sessions and devices.
 *
 * Always starts at the default, never a synchronous localStorage read: this
 * is a client component but still server-rendered for the initial HTML, and
 * `window` isn't there to read at that point. Reading localStorage in a
 * `useState` initializer would make the client's first render disagree with
 * that server markup - a hydration mismatch, not just a cosmetic flash. The
 * effect below reconciles it after hydration: localStorage first (fast,
 * covers an API blip), then the server preference - the actual cross-device
 * source of truth - once that fetch resolves.
 */
export function useRankedListLength(): [
  RankedListLength,
  (length: RankedListLength) => void,
] {
  const [length, setLength] = useState<RankedListLength>(DEFAULT_LENGTH);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/preferences').then(async (res) => {
      if (cancelled) return;
      if (res.ok) {
        const body = await res.json();
        if (isLength(body.ranked_list_length)) {
          setLength(body.ranked_list_length);
          window.localStorage.setItem(STORAGE_KEY, body.ranked_list_length);
          return;
        }
      }
      // The server preference is unset or unreachable - fall back to
      // whatever's cached on this device rather than staying at the default.
      const local = readLocal();
      if (local !== DEFAULT_LENGTH) setLength(local);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((next: RankedListLength) => {
    setLength(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    void fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranked_list_length: next }),
    });
  }, []);

  return [length, update];
}
