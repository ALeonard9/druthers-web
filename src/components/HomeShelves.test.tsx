/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SummaryShelf } from '@/lib/types';
import { HomeShelves } from './HomeShelves';

vi.mock('./HomeShelfCarousel', () => ({
  HomeShelfCarousel: ({ shelf }: { shelf: SummaryShelf }) => <div>{shelf.label}</div>,
}));

const shelves: SummaryShelf[] = [
  { category: 'movies', label: 'Movies', ranked_count: 1, queued_count: 0, public: false, top: [] },
  { category: 'tv', label: 'TV', ranked_count: 1, queued_count: 0, public: false, top: [] },
  { category: 'books', label: 'Books', ranked_count: 1, queued_count: 0, public: false, top: [] },
  { category: 'games', label: 'Games', ranked_count: 1, queued_count: 0, public: false, top: [] },
];

describe('HomeShelves', () => {
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

  it('renders only enabled shelves in the account preference order', async () => {
    render(<HomeShelves shelves={shelves} />);

    await waitFor(() => expect(screen.queryByText('Books')).toBeNull());
    expect(screen.queryByText('TV')).toBeNull();
    expect(screen.getByText('Games').compareDocumentPosition(screen.getByText('Movies'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(fetch).toHaveBeenCalledWith('/api/preferences');
  });
});
