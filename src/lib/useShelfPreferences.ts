'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SHELF_PREFERENCES,
  readShelfPreferences,
  SHELF_PREFERENCES_EVENT,
  type ShelfPreferences,
} from './shelfPreferences';

export function useShelfPreferences(): ShelfPreferences {
  const [preferences, setPreferences] = useState(DEFAULT_SHELF_PREFERENCES);

  useEffect(() => {
    const refresh = () => setPreferences(readShelfPreferences());
    refresh();
    window.addEventListener(SHELF_PREFERENCES_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SHELF_PREFERENCES_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return preferences;
}
