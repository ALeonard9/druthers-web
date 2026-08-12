import { describe, expect, it } from 'vitest';
import {
  normalizeShelfPreferences,
  orderedEnabledShelves,
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
});
