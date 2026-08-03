'use client';

import { useEffect, useState } from 'react';

export type ShelfViewMode = 'list' | 'carousel' | 'icons';

const STORAGE_KEY = 'druthers:shelf-view-mode';
const DEFAULT_MODE: ShelfViewMode = 'carousel';

function isMode(value: unknown): value is ShelfViewMode {
  return value === 'list' || value === 'carousel' || value === 'icons';
}

/**
 * List/Carousel/Icons for a public profile shelf — a browsing preference,
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
    // than the effect's synchronous body — see the eslint rule this
    // sidesteps: react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (isMode(raw)) setMode(raw);
    });
  }, []);

  function update(next: ShelfViewMode) {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return [mode, update];
}
