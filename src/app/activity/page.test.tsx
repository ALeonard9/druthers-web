/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityPage from './page';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), getSessionUser: vi.fn() }));

vi.mock('@/lib/api', () => ({ ApiError: class ApiError extends Error {}, apiFetch: mocks.apiFetch }));
vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('activity page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
    mocks.apiFetch.mockReset().mockImplementation((path: string) => {
      if (path === '/v1/users/me/activity?category=book') return Promise.resolve([]);
      if (path === '/v1/users/me/feed?limit=50') return Promise.resolve({ items: [], next_cursor: null });
      if (path === '/v1/users/me/friends' || path === '/v1/users/me/following') return Promise.resolve([]);
      throw new Error(`Unexpected path: ${path}`);
    });
  });

  afterEach(cleanup);

  it('loads the private activity and authorized social feed while retaining the category filter', async () => {
    render(await ActivityPage({ searchParams: Promise.resolve({ category: 'book' }) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/activity?category=book');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/feed?limit=50');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/friends');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/following');
    expect(screen.getByRole('link', { name: 'Books' }).getAttribute('href')).toBe('/activity?category=book');
  });
});
