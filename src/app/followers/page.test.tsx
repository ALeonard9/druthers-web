/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FollowersPage from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));
vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));

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
});
