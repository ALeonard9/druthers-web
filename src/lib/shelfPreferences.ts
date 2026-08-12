'use client';

import type { ShelfId } from './duelShelves';

export const SHELF_ORDER: ShelfId[] = ['movies', 'tv', 'games', 'books'];
export const SHELF_PREFERENCES_EVENT = 'druthers:shelf-preferences';

export interface ShelfPreferences {
  order: ShelfId[];
  enabled: ShelfId[];
}

export const DEFAULT_SHELF_PREFERENCES: ShelfPreferences = {
  order: SHELF_ORDER,
  enabled: SHELF_ORDER,
};

function isShelfId(value: unknown): value is ShelfId {
  return typeof value === 'string' && SHELF_ORDER.includes(value as ShelfId);
}

// Older saved values and malformed local storage should never make a shelf
// disappear permanently. Preserve known choices, then append new shelves.
export function normalizeShelfPreferences(value: unknown): ShelfPreferences {
  const raw = value as Partial<ShelfPreferences> | null;
  const order = Array.isArray(raw?.order) ? raw.order.filter(isShelfId) : [];
  const enabled = Array.isArray(raw?.enabled) ? raw.enabled.filter(isShelfId) : SHELF_ORDER;
  return {
    order: [...new Set(order), ...SHELF_ORDER.filter((id) => !order.includes(id))],
    enabled: [...new Set(enabled)],
  };
}

export function saveShelfPreferences(next: ShelfPreferences): Promise<void> {
  const normalized = normalizeShelfPreferences(next);
  window.dispatchEvent(new CustomEvent(SHELF_PREFERENCES_EVENT, { detail: normalized }));
  return fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shelf_order: normalized.order,
      enabled_shelves: normalized.enabled,
    }),
  }).then(() => undefined);
}

export function orderedEnabledShelves(preferences: ShelfPreferences): ShelfId[] {
  return preferences.order.filter((id) => preferences.enabled.includes(id));
}
