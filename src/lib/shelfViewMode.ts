'use client';

import { useEffect, useState } from 'react';

export type ShelfViewMode = 'list' | 'carousel' | 'icons';

const STORAGE_KEY = 'druthers:shelf-view-mode';
const DEFAULT_MODE: ShelfViewMode = 'carousel';

function isMode(value: unknown): value is ShelfViewMode {
  return value === 'list' || value === 'carousel' || value === 'icons';
}

function readInitialMode(): ShelfViewMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  if (isMode(viewParam)) return viewParam;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isMode(raw) ? raw : DEFAULT_MODE;
}

/**
 * List/Carousel/Icons for a public profile shelf - a browsing preference,
 * not a sharing one, so it's saved on this device only (no cross-device
 * requirement the way ranked_list_length has, matching SoundPicker's
 * precedent). Starts at the default and reads localStorage in an effect
 * rather than a lazy initializer, for the same reason as
 * useRankedListLength: this renders server-side first, where `window`
 * doesn't exist, and a synchronous read there would make the client's first
 * render disagree with that markup.
 */
export function useShelfViewMode(): [ShelfViewMode, (mode: ShelfViewMode) => void] {
  const [mode, setMode] = useState<ShelfViewMode>(DEFAULT_MODE);

  useEffect(() => {
    // Deferred into a microtask so the setState lives in a callback rather
    // than the effect's synchronous body - sidesteps react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      const initial = readInitialMode();
      if (initial !== DEFAULT_MODE) {
        setMode(initial);
      }
    });
  }, []);

  function update(next: ShelfViewMode) {
    setMode(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      const url = new URL(window.location.href);
      url.searchParams.set('view', next);
      window.history.replaceState({}, '', url.toString());
    }
  }

  return [mode, update];
}
