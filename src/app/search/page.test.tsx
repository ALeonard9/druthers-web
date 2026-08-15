/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalSearch } from '@/lib/types';
import SearchPage from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

const EMPTY_CATALOG_RESULTS: GlobalSearch = {
  query: 'ada',
  corrected: null,
  movies: [],
  tv_shows: [],
  games: [],
  books: [],
};

let enabledShelves: string[];
let catalogResults: GlobalSearch;
let peopleResults: { id: string; display_name: string; handle: string | null }[];

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: mocks.apiFetch,
}));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));

vi.mock('@/components/MultiAddMode', () => ({
  MultiAddMode: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/AddFromSearchButton', () => ({
  AddFromSearchButton: () => null,
}));

describe('global search page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
    mocks.apiFetch.mockReset();
    enabledShelves = ['movies', 'tv', 'games', 'books'];
    catalogResults = EMPTY_CATALOG_RESULTS;
    peopleResults = [];
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({ shelf_order: ['movies', 'tv', 'games', 'books'], enabled_shelves: enabledShelves });
      }
      if (path.startsWith('/v1/movies/search')) return Promise.resolve(catalogResults.movies);
      if (path.startsWith('/v1/tv-shows/search')) return Promise.resolve(catalogResults.tv_shows);
      if (path.startsWith('/v1/games/search')) return Promise.resolve(catalogResults.games);
      if (path.startsWith('/v1/books/search')) return Promise.resolve(catalogResults.books);
      if (path.startsWith('/v1/search/users')) {
        return Promise.resolve({ query: 'ada', corrected: null, users: peopleResults });
      }
      throw new Error(`Unexpected API path: ${path}`);
    });
  });

  afterEach(cleanup);

  it('uses only the protected people endpoint for the Users scope and shows its empty state', async () => {
    render(
      await SearchPage({ searchParams: Promise.resolve({ q: 'private', scope: 'users' }) }),
    );

    expect(mocks.apiFetch).toHaveBeenCalledTimes(2);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=private');
    expect(screen.getByRole('heading', { name: /People 0/ })).toBeTruthy();
    expect(screen.getByText('No people found.')).toBeTruthy();
    expect(screen.queryByText(/Nothing found for/)).toBeNull();
  });

  it('combines catalog and people results for All, linking people to their profiles', async () => {
    peopleResults = [{ id: 'user-1', display_name: 'Ada Lovelace', handle: 'ada' }];

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'all' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.getByRole('link', { name: 'Ada Lovelace' }).getAttribute('href')).toBe('/u/ada');
    expect(screen.queryByText('No people found.')).toBeNull();
  });

  it('keeps other catalog domains out of a scoped search', async () => {
    catalogResults = {
      query: 'ada',
      corrected: null,
      movies: [
        {
          tmdb: 1,
          imdb: null,
          title: 'Ada Movie',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      tv_shows: [],
      games: [],
      books: [],
    };

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'books' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.queryByText('Ada Movie')).toBeNull();
    expect(screen.getByText(/Nothing found for “ada” in books/)).toBeTruthy();
  });

  it('queries and renders only enabled shelves', async () => {
    enabledShelves = ['books'];
    catalogResults = {
      ...EMPTY_CATALOG_RESULTS,
      movies: [
        {
          tmdb: 1,
          imdb: null,
          title: 'Disabled Movie',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
    };

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'all' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(screen.queryByText('Disabled Movie')).toBeNull();
    expect(screen.queryByRole('heading', { name: /Movies|TV Shows|Games|Books/ })).toBeNull();
  });

  it('links valid movie and TV IMDb IDs to canonical title pages in new tabs', async () => {
    catalogResults = {
      query: 'arrival',
      corrected: null,
      movies: [
        {
          tmdb: 329865,
          imdb: 'tt2543164',
          title: 'Arrival',
          year: '2016',
          release_date: '2016-11-11',
          poster_url: null,
          type: 'movie',
          popularity: 50,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      tv_shows: [
        {
          tvmaze: 61812,
          imdb: 'tt20869502',
          title: 'Arrival Point',
          year: '2024',
          status: 'Running',
          network: 'Example',
          poster_url: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      games: [],
      books: [],
    };

    render(
      await SearchPage({ searchParams: Promise.resolve({ q: 'arrival', scope: 'all' }) }),
    );

    for (const [name, href] of [
      ['Arrival', 'https://www.imdb.com/title/tt2543164/'],
      ['Arrival Point', 'https://www.imdb.com/title/tt20869502/'],
    ]) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('href')).toBe(href);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('hides invalid movie IMDb links and falls TV results back to TVMaze', async () => {
    catalogResults = {
      query: 'broken',
      corrected: null,
      movies: [
        {
          tmdb: 1,
          imdb: null,
          title: 'Missing Movie ID',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
        {
          tmdb: 2,
          imdb: 'not-an-imdb-id',
          title: 'Malformed Movie ID',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      tv_shows: [
        {
          tvmaze: 99,
          imdb: 'ttbad',
          title: 'TVMaze Fallback',
          year: null,
          status: null,
          network: null,
          poster_url: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      games: [],
      books: [],
    };

    render(
      await SearchPage({ searchParams: Promise.resolve({ q: 'broken', scope: 'all' }) }),
    );

    expect(screen.queryByRole('link', { name: 'Missing Movie ID' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Malformed Movie ID' })).toBeNull();
    const fallback = screen.getByRole('link', { name: 'TVMaze Fallback' });
    expect(fallback.getAttribute('href')).toBe('https://www.tvmaze.com/shows/99');
    expect(fallback.getAttribute('target')).toBe('_blank');
  });
});
