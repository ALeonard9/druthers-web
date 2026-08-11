/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchPage from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: mocks.apiFetch,
}));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));

vi.mock('@/components/MultiAddMode', () => ({
  MultiAddMode: ({ children }: { children: React.ReactNode }) => children,
}));

describe('global search page people results', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
    mocks.apiFetch.mockReset();
  });

  afterEach(cleanup);

  it('uses only the protected people endpoint for the Users scope and shows its empty state', async () => {
    mocks.apiFetch.mockResolvedValue({ query: 'private', corrected: null, users: [] });

    render(
      await SearchPage({ searchParams: Promise.resolve({ q: 'private', scope: 'users' }) }),
    );

    expect(mocks.apiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=private');
    expect(screen.getByRole('heading', { name: /People 0/ })).toBeTruthy();
    expect(screen.getByText('No people found.')).toBeTruthy();
    expect(screen.queryByText(/Nothing found for/)).toBeNull();
  });

  it('combines catalog and people results for All, linking people to their profiles', async () => {
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/search/users?q=ada') {
        return Promise.resolve({
          query: 'ada',
          corrected: null,
          users: [{ id: 'user-1', display_name: 'Ada Lovelace', handle: 'ada' }],
        });
      }
      return Promise.resolve({
        query: 'ada',
        corrected: null,
        movies: [],
        tv_shows: [],
        games: [],
        books: [],
      });
    });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'all' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.getByRole('link', { name: 'Ada Lovelace' }).getAttribute('href')).toBe('/u/ada');
    expect(screen.queryByText('No people found.')).toBeNull();
  });

  it('keeps other catalog domains out of a scoped search', async () => {
    mocks.apiFetch.mockResolvedValue({
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
    });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'books' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.queryByText('Ada Movie')).toBeNull();
    expect(screen.getByText(/Nothing found for “ada” in books/)).toBeTruthy();
  });
});
