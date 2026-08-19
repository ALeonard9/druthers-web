/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getImpersonationMeta: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/api', () => ({
  apiFetch: mocks.apiFetch,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));
vi.mock('@/lib/session', () => ({ getImpersonationMeta: mocks.getImpersonationMeta }));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/components/AdminUserDetailView', () => ({ AdminUserDetailView: () => null }));

describe('AdminUserDetailPage', () => {
  afterEach(cleanup);

  it('bails out before fetching while impersonating, rather than risking notFound() replacing the block screen', async () => {
    // notFound() while impersonating would ALSO replace AdminLayout's block
    // screen with Next's built-in not-found page - the same failure mode
    // the impersonation checks on the sibling admin pages exist to prevent,
    // just reached through the 403 -> notFound() mapping below instead of
    // an uncaught throw.
    mocks.getImpersonationMeta.mockResolvedValue({ target: { id: 't1' } });

    const element = await Page({
      params: Promise.resolve({ id: 'u1' }),
      searchParams: Promise.resolve({}),
    });

    expect(element).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('fetches the user normally with no impersonation active', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockResolvedValue({ id: 'u1', handle: 'follower' });

    render(
      await Page({ params: Promise.resolve({ id: 'u1' }), searchParams: Promise.resolve({}) }),
    );

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/users/u1');
  });
});
