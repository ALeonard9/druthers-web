/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getImpersonationMeta: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));
vi.mock('@/lib/session', () => ({ getImpersonationMeta: mocks.getImpersonationMeta }));
vi.mock('@/components/AdminDirectory', () => ({ AdminDirectory: () => null }));

describe('AdminDirectoryPage', () => {
  afterEach(cleanup);

  it('bails out before fetching while impersonating - AdminLayout renders the block screen, not this page', async () => {
    // A real regression, not a hypothetical: without this check the page's
    // own apiFetch call ran on the impersonated token, threw an uncaught
    // 403 ("Admin privileges required"), and the whole /admin request came
    // back 404 instead of AdminLayout's intended 200-with-block-screen.
    mocks.getImpersonationMeta.mockResolvedValue({ target: { id: 't1' } });

    const element = await Page({ searchParams: Promise.resolve({}) });

    expect(element).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('fetches the directory normally with no impersonation active', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockResolvedValue({ total: 0, limit: 50, offset: 0, users: [] });

    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/admin/users?limit=50&offset=0'),
    );
  });
});
