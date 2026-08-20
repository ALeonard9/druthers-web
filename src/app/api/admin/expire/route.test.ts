import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  clearImpersonationCookies: vi.fn(),
  cookies: vi.fn(),
  cookieStore: {},
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/sessionCookies', () => ({
  clearImpersonationCookies: mocks.clearImpersonationCookies,
}));

describe('GET /api/admin/expire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue(mocks.cookieStore);
  });

  it('clears the impersonation cookies and lands back on the target detail page', async () => {
    const response = await GET(
      new Request('http://localhost/api/admin/expire?target=target-1&handle=private-user'),
    );

    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(mocks.cookieStore);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/admin/users/target-1?impersonation_expired=1&impersonation_handle=private-user',
    );
  });

  it('still marks the session expired with no handle - a target can genuinely have none', async () => {
    const response = await GET(
      new Request('http://localhost/api/admin/expire?target=target-1'),
    );

    expect(response.headers.get('location')).toBe(
      'http://localhost/admin/users/target-1?impersonation_expired=1',
    );
  });

  it('falls back to /admin with no target - still clears cookies rather than stranding the admin', async () => {
    const response = await GET(new Request('http://localhost/api/admin/expire'));

    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(mocks.cookieStore);
    expect(response.headers.get('location')).toBe('http://localhost/admin');
  });
});
