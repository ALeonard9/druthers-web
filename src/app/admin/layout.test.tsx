/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLayout from './layout';

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  getImpersonationMeta: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/adminAuth', () => ({ requireAdminUser: mocks.requireAdminUser }));
vi.mock('@/lib/session', () => ({ getImpersonationMeta: mocks.getImpersonationMeta }));
vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  usePathname: () => '/admin',
}));

const IMPERSONATION_META = {
  session_id: 's1',
  expires_at: '2026-08-19T12:15:00Z',
  target: { id: 'target-1', handle: 'private-user', display_name: null, email: 'p@example.com' },
  acting_admin: { id: 'admin-1', handle: 'adam', email: 'admin@example.com' },
};

describe('admin layout gate', () => {
  beforeEach(() => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the console for a real admin', async () => {
    mocks.requireAdminUser.mockResolvedValue({
      user_id: '1',
      email: 'admin@example.com',
      user_group: 'admin',
    });

    const element = await AdminLayout({ children: <div>directory</div> });
    const { getByText } = render(element);

    expect(getByText('admin@example.com')).toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it('calls notFound(), not a 403 page, when requireAdminUser refuses a non-admin', async () => {
    mocks.requireAdminUser.mockResolvedValue(null);

    await expect(AdminLayout({ children: <div>directory</div> })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it('calls notFound() the same way when the refusal came from a forged admin cookie', async () => {
    // requireAdminUser already resolved the forgery (its own unit tests cover
    // that against the API) - this test only proves the layout reacts to a
    // refusal the same way regardless of what the cookie claimed.
    mocks.requireAdminUser.mockResolvedValue(null);

    await expect(AdminLayout({ children: <div>directory</div> })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  it('blocks with an escape action while impersonating, instead of gating on the wrong token', async () => {
    // While impersonating, getToken() (and therefore requireAdminUser())
    // resolves to the impersonated user's token, not the admin's own - so
    // this must never reach requireAdminUser() at all, or it would notFound()
    // an admin who is simply mid-view-as.
    mocks.getImpersonationMeta.mockResolvedValue(IMPERSONATION_META);

    const element = await AdminLayout({ children: <div>directory contents</div> });
    const { getByText, queryByText } = render(element);

    expect(getByText(/You are viewing as/)).toBeTruthy();
    expect(getByText('@private-user', { exact: false })).toBeTruthy();
    expect(queryByText('directory contents')).toBeNull();
    expect(mocks.requireAdminUser).not.toHaveBeenCalled();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
