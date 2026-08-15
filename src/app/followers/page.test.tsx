/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FollowersPage from './page';

// ApiError must be the real class shape, not omitted from the mock: the page
// branches on `err instanceof ApiError`, so a mock without it sends every
// error down the rethrow path and the redirect can never be observed.
const { ApiError } = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch, ApiError }));
vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const publicVisibility = {
  handle: 'ada',
  visibility_profile: 'public',
  visibility_movies: 'public',
  visibility_tv: 'public',
  visibility_books: 'public',
  visibility_games: 'public',
  visibility_watchlist_movies: 'public',
  visibility_watchlist_tv: 'public',
  visibility_watchlist_books: 'public',
  visibility_watchlist_games: 'public',
} as const;

describe('followers page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
    mocks.apiFetch.mockReset();
    // mockClear, not mockReset: reset would strip the throwing implementation
    // that stands in for Next's redirect control flow.
    mocks.redirect.mockClear();
  });

  afterEach(cleanup);

  it('renders the parent API follower count for a public profile', async () => {
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/visibility') return Promise.resolve(publicVisibility);
      if (path === '/v1/users/me/followers') {
        return Promise.resolve([
          { id: 'follow-1', user: { id: 'one', handle: 'grace', display_name: 'Grace Hopper' }, followed_at: '2026-08-01T00:00:00Z' },
          { id: 'follow-2', user: { id: 'two', handle: 'lin', display_name: 'Lin' }, followed_at: '2026-08-02T00:00:00Z' },
        ]);
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    render(await FollowersPage());

    expect(mocks.apiFetch).toHaveBeenNthCalledWith(1, '/v1/users/me/visibility');
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(2, '/v1/users/me/followers');
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('people follow your profile.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View followers' }).getAttribute('href')).toBe('/friends');
  });

  it('does not fetch or display a follower count for a non-public profile', async () => {
    mocks.apiFetch.mockResolvedValue({ ...publicVisibility, visibility_profile: 'friends' });

    render(await FollowersPage());

    expect(mocks.apiFetch).toHaveBeenCalledTimes(1);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/visibility');
    expect(screen.getByText('Make your profile public to track followers')).toBeTruthy();
    expect(screen.queryByText('Current audience')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go to sharing settings' }).getAttribute('href')).toBe('/settings#sharing');
  });

  // A session cookie outlives the account it names - a stale cookie from an
  // earlier local database renders a valid-looking user whose API row is gone.
  // That has to bounce to /login, not blow up the route with a 500.
  it.each([
    [404, 'User with id abc not found'],
    [401, 'Not authenticated'],
  ])('redirects to /login when the session user is rejected with %i', async (status, detail) => {
    mocks.apiFetch.mockRejectedValue(new ApiError(status, detail));

    await expect(FollowersPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/login');
  });

  it('rethrows an unexpected API failure instead of hiding it behind a redirect', async () => {
    mocks.apiFetch.mockRejectedValue(new ApiError(500, 'boom'));

    await expect(FollowersPage()).rejects.toThrow('boom');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
