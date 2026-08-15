'use client';

import { normalizeShelfPreferences, type ShelfPreferences } from './shelfPreferences';

export const SHELF_PREFERENCES_EVENT = 'druthers:shelf-preferences';

export function saveShelfPreferences(next: ShelfPreferences): Promise<void> {
  const normalized = normalizeShelfPreferences(next);
  return fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shelf_order: normalized.order,
      enabled_shelves: normalized.enabled,
    }),
  }).then((response) => {
    if (!response.ok) throw new Error('Could not save shelf preferences');
    window.dispatchEvent(new CustomEvent(SHELF_PREFERENCES_EVENT, { detail: normalized }));
  });
}
