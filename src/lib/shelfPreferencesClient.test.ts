/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveShelfPreferences } from './shelfPreferencesClient';

afterEach(() => vi.restoreAllMocks());

describe('saveShelfPreferences', () => {
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
