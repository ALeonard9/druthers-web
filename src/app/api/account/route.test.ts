import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  clearSessionCookies: vi.fn(),
  cookies: vi.fn(),
  getSessionUser: vi.fn(),
  cookieStore: { delete: vi.fn() },
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch, ApiError: class ApiError extends Error {} }));
vi.mock('@/lib/session', () => ({
  getSessionUser: mocks.getSessionUser,
  clearSessionCookies: mocks.clearSessionCookies,
}));

describe('DELETE /api/account', () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset();
    mocks.clearSessionCookies.mockReset();
    mocks.cookies.mockReset().mockResolvedValue(mocks.cookieStore);
    mocks.getSessionUser.mockReset().mockResolvedValue({ user_id: 'user-uuid' });
  });

  it('deletes only the authenticated user and clears their session after success', async () => {
    mocks.apiFetch.mockResolvedValue(undefined);

    const response = await DELETE();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/user-uuid', { method: 'DELETE' });
    expect(mocks.clearSessionCookies).toHaveBeenCalledWith(mocks.cookieStore);
    expect(response.status).toBe(200);
  });

  it('does not clear the session when the API rejects deletion', async () => {
    mocks.apiFetch.mockRejectedValue(new Error('Upstream rejected deletion'));

    const response = await DELETE();

    expect(response.status).toBe(500);
    expect(mocks.clearSessionCookies).not.toHaveBeenCalled();
  });
});
