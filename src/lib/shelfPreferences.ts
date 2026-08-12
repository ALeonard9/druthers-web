'use client';

import type { ShelfId } from './duelShelves';

export const SHELF_ORDER: ShelfId[] = ['movies', 'tv', 'books', 'games'];
export const SHELF_PREFERENCES_EVENT = 'druthers:shelf-preferences';
const STORAGE_KEY = 'druthers:shelf-preferences';

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

export function readShelfPreferences(): ShelfPreferences {
  if (typeof window === 'undefined') return DEFAULT_SHELF_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeShelfPreferences(JSON.parse(raw)) : DEFAULT_SHELF_PREFERENCES;
  } catch {
    return DEFAULT_SHELF_PREFERENCES;
  }
}

export function saveShelfPreferences(next: ShelfPreferences) {
  const normalized = normalizeShelfPreferences(next);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(SHELF_PREFERENCES_EVENT));
}

export function orderedEnabledShelves(preferences: ShelfPreferences): ShelfId[] {
  return preferences.order.filter((id) => preferences.enabled.includes(id));
}
