'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SHELF_PREFERENCES,
  normalizeShelfPreferences,
  SHELF_PREFERENCES_EVENT,
  type ShelfPreferences,
} from './shelfPreferences';

export function useShelfPreferences(): ShelfPreferences {
  const [preferences, setPreferences] = useState(DEFAULT_SHELF_PREFERENCES);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch('/api/preferences');
        if (!response.ok || cancelled) return;
        const body = await response.json();
        if (cancelled) return;
        setPreferences(
          normalizeShelfPreferences({ order: body.shelf_order, enabled: body.enabled_shelves }),
        );
      } catch {
        // The default stays visible while the account preference cannot load.
      }
    };
    const update = (event: Event) => {
      const next = (event as CustomEvent<ShelfPreferences>).detail;
      if (next) setPreferences(next);
    };
    void refresh();
    window.addEventListener(SHELF_PREFERENCES_EVENT, update);
    return () => {
      cancelled = true;
      window.removeEventListener(SHELF_PREFERENCES_EVENT, update);
    };
  }, []);

  return preferences;
}
