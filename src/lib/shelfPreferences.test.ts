import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  normalizeShelfPreferences,
  orderedEnabledShelves,
  isShelfEnabled,
  type ShelfPreferences,
} from './shelfPreferences';

describe('shelf preferences', () => {
  it('keeps a user order while appending shelves introduced after it was saved', () => {
    expect(normalizeShelfPreferences({ order: ['games', 'movies'], enabled: ['games'] })).toEqual({
      order: ['games', 'movies', 'tv', 'books'],
      enabled: ['games'],
    });
  });

  it('only returns enabled shelves in the configured order', () => {
    expect(
      orderedEnabledShelves({
        order: ['books', 'tv', 'games', 'movies'],
        enabled: ['movies', 'books'],
      }),
    ).toEqual(['books', 'movies']);
  });

  it('checks if a shelf is enabled', () => {
    const prefs = {
      order: ['books', 'tv', 'games', 'movies'] as const,
      enabled: ['movies', 'books'] as const,
    } as unknown as ShelfPreferences;
    expect(isShelfEnabled(prefs, 'movies')).toBe(true);
    expect(isShelfEnabled(prefs, 'tv')).toBe(false);
  });

  it('is safe for a server component to import', () => {
    const source = readFileSync(new URL('./shelfPreferences.ts', import.meta.url), 'utf8');

    expect(source).not.toMatch(/^['\"]use client['\"];?/m);
    expect(source).not.toMatch(/\b(?:window|document|CustomEvent)\b/);
  });
});
