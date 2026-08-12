/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeShelfPreferences,
  orderedEnabledShelves,
  saveShelfPreferences,
} from './shelfPreferences';

afterEach(() => vi.restoreAllMocks());

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

  it('saves preferences through the account preferences API', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));

    await saveShelfPreferences({
      order: ['games', 'books', 'movies', 'tv'],
      enabled: ['games', 'movies'],
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shelf_order: ['games', 'books', 'movies', 'tv'],
        enabled_shelves: ['games', 'movies'],
      }),
    });
  });
});
