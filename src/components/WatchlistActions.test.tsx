/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WatchlistActionItem } from '@/lib/deck';
import {
  WatchlistActionProvider,
  WatchlistActions,
  useWatchlistItemRemoved,
} from './WatchlistActions';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

vi.mock('@/lib/pop', () => ({ playPop: vi.fn() }));

const item: WatchlistActionItem = {
  id: 'movie-1',
  title: 'Test Movie',
  onRankings: false,
  rankable: true,
  trackHref: '/api/movies/movie-1/track',
  rankHref: '/movies/ranking?item=movie-1',
};

function RemovableItem() {
  const removed = useWatchlistItemRemoved(item.id);
  return removed ? null : (
    <div data-testid="watchlist-item">
      <WatchlistActions item={item} />
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe('WatchlistActions', () => {
  it('uses Rank copy while retaining ranked and not-rankable states', () => {
    render(
      <WatchlistActionProvider>
        <WatchlistActions item={item} />
        <WatchlistActions item={{ ...item, id: 'ranked', title: 'Ranked Movie', onRankings: true }} />
        <WatchlistActions item={{ ...item, id: 'future', title: 'Future Movie', rankable: false }} />
      </WatchlistActionProvider>,
    );

    expect(screen.getByRole('button', { name: 'Rank Test Movie' }).textContent).toBe('Rank');
    const rankedButton = screen.getByRole('button', {
      name: 'Ranked Movie is in rankings',
    }) as HTMLButtonElement;
    expect(rankedButton.disabled).toBe(true);
    expect(rankedButton.textContent).toBe('In Rankings');
    expect(screen.getByText('Not rankable yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rank Future Movie' })).toBeNull();
  });

  it('promotes with the title endpoint and opens its comparison flow', async () => {
    render(
      <WatchlistActionProvider>
        <WatchlistActions item={item} />
      </WatchlistActionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rank Test Movie' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/movies/movie-1/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_rankings: true }),
      }),
    );
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith('/movies/ranking?item=movie-1'),
    );
  });

  it('confirms removal, hides the item, and restores it through Undo', async () => {
    render(
      <WatchlistActionProvider>
        <RemovableItem />
      </WatchlistActionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Test Movie from watchlist' }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('group', { name: 'Confirm removing Test Movie from watchlist' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(global.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Test Movie from watchlist' }));

    fireEvent.click(screen.getByRole('button', { name: 'Confirm remove Test Movie' }));

    await waitFor(() => expect(screen.queryByTestId('watchlist-item')).toBeNull());
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/movies/movie-1/track', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_watchlist: false }),
    });
    expect(screen.getByRole('status').textContent).toContain('Removed “Test Movie”');

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    await waitFor(() => expect(screen.getByTestId('watchlist-item')).toBeTruthy());
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/movies/movie-1/track', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_watchlist: true }),
    });
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
