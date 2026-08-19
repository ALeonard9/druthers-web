/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminLayout from './layout';

const mocks = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/adminAuth', () => ({ requireAdminUser: mocks.requireAdminUser }));
vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  usePathname: () => '/admin',
}));

describe('admin layout gate', () => {
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
});
