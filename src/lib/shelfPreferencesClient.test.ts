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

  it('rejects a failed save instead of announcing unsaved preferences', async () => {
    const listener = vi.fn();
    window.addEventListener('druthers:shelf-preferences', listener);
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(
      saveShelfPreferences({
        order: ['movies', 'tv', 'games', 'books'],
        enabled: ['movies', 'books'],
      }),
    ).rejects.toThrow('Could not save shelf preferences');

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('druthers:shelf-preferences', listener);
  });
});
