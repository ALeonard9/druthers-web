/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MovieSearch } from './MovieSearch';
import type { MovieSearchResult } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function result(partial: Partial<MovieSearchResult> & { tmdb: number; title: string }): MovieSearchResult {
  return {
    imdb: null,
    year: null,
    release_date: null,
    poster_url: null,
    type: 'movie',
    popularity: null,
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    ...partial,
  };
}

async function search(title: string) {
  fireEvent.change(screen.getByPlaceholderText('e.g. The Matrix'), { target: { value: title } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findAllByText(title);
}

describe('MovieSearch unreleased movies (web#180)', () => {
  afterEach(cleanup);

  it('shows a release-date badge and no rank affordance for a movie far from release', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        result({ tmdb: 1, title: 'Avengers: Doomsday', release_date: '2099-12-16' }),
      ],
    });

    render(<MovieSearch />);
    await search('Avengers: Doomsday');

    expect(screen.getByText(/Release: Dec 16, 2099/)).toBeTruthy();
    expect(screen.getByText('Not rankable yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '+ Rankings' })).toBeNull();
    // Still addable to the watchlist even though it isn't rankable yet.
    expect(screen.getByRole('button', { name: '+ Watchlist' })).toBeTruthy();
  });

  it('offers rankings normally for an already-released movie', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [result({ tmdb: 2, title: 'The Matrix', release_date: '1999-03-30' })],
    });

    render(<MovieSearch />);
    await search('The Matrix');

    expect(screen.queryByText('Not rankable yet')).toBeNull();
    expect(screen.getByRole('button', { name: '+ Rankings' })).toBeTruthy();
  });
});

describe('MovieSearch on-watchlist indicator', () => {
  afterEach(cleanup);

  it('shows a single badge, not a duplicate disabled button, for a title already on the watchlist', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        result({ tmdb: 3, title: 'Casablanca', release_date: '1942-11-26', on_watchlist: true }),
      ],
    });

    render(<MovieSearch />);
    await search('Casablanca');

    expect(screen.getAllByText(/On Watchlist/)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Watchlist/ })).toBeNull();
    expect(screen.getByRole('button', { name: '→ Move to Rankings' })).toBeTruthy();
  });
});
