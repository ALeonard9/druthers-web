/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: mocks.apiFetch,
}));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('@/components/ShareTop5Button', () => ({ ShareTop5Button: () => null }));
vi.mock('@/components/RankingsBoard', () => ({ RankingsBoard: () => null }));
vi.mock('@/components/TVRankingsBoard', () => ({ TVRankingsBoard: () => null }));
vi.mock('@/components/MyListViewer', () => ({ MyListViewer: () => null }));
vi.mock('@/components/WatchlistViewer', () => ({ WatchlistViewer: () => null }));
vi.mock('@/components/RankingDuelPage', () => ({ RankingDuelPage: () => null }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), usePathname: () => '/', useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));

describe('tv ranking/list page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: '1' });
    mocks.apiFetch.mockImplementation((url) => {
      if (url.includes('/summary')) return Promise.resolve({ shelves: [] });
      return Promise.resolve([]);
    });
  });
  afterEach(cleanup);

  it('fetches with the correct filter param on_rankings=true', async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mocks.apiFetch).toHaveBeenCalledWith(expect.stringContaining('?on_rankings=true'));
  });
});
