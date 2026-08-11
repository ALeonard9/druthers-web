/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DeckItem, WatchlistActionItem } from '@/lib/deck';
import type { ShelfViewMode } from '@/lib/shelfViewMode';
import { WatchlistActions } from './WatchlistActions';
import { WatchlistViewer } from './WatchlistViewer';

const view = vi.hoisted(() => ({ mode: 'carousel' as ShelfViewMode }));

vi.mock('@/lib/shelfViewMode', () => ({
  useShelfViewMode: () => [view.mode, vi.fn()],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const actions: WatchlistActionItem = {
  id: 'movie-1',
  title: 'Test Movie',
  onRankings: false,
  rankable: true,
  trackHref: '/api/movies/movie-1/track',
  rankHref: '/movies/ranking?item=movie-1',
};

const item: DeckItem = {
  id: 'movie-1',
  rank: 1,
  title: 'Test Movie',
  subtitle: '2026 · Drama',
  posterUrl: null,
  href: '/movies/movie-1',
  watchlistActions: actions,
};

afterEach(cleanup);

describe('WatchlistViewer actions', () => {
  it.each(['list', 'carousel'] as ShelfViewMode[])('renders Rank and Remove in %s view', (mode) => {
    view.mode = mode;
    render(
      <WatchlistViewer
        items={[item]}
        label="Your watchlist"
        iconsContent={<span>Icons</span>}
        filterBar={<span>Filters</span>}
        emptyMessage={<span>Empty</span>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Rank Test Movie' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Remove Test Movie from watchlist' }),
    ).toBeTruthy();
  });

  it('keeps the same Rank and Remove actions in icons view', () => {
    view.mode = 'icons';
    render(
      <WatchlistViewer
        items={[item]}
        label="Your watchlist"
        iconsContent={<WatchlistActions item={actions} />}
        filterBar={<span>Filters</span>}
        emptyMessage={<span>Empty</span>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Rank Test Movie' }).textContent).toBe('Rank');
    expect(
      screen.getByRole('button', { name: 'Remove Test Movie from watchlist' }),
    ).toBeTruthy();
  });
});
