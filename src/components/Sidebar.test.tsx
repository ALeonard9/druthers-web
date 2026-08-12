/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            shelf_order: ['games', 'books', 'movies', 'tv'],
            enabled_shelves: ['games', 'movies'],
          }),
        ),
      ),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows enabled shelf links in the account preference order', async () => {
    render(<Sidebar />);

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Books' })).toBeNull());
    expect(screen.queryByRole('link', { name: 'TV' })).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Games' }).compareDocumentPosition(
        screen.getByRole('link', { name: 'Movies' }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(fetch).toHaveBeenCalledWith('/api/preferences');
  });
});
