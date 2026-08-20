import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
}));

class MockApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

vi.mock('./api', () => ({
  ApiError: MockApiError,
  apiFetch: mocks.apiFetch,
}));

vi.mock('./session', () => ({ getSessionUser: mocks.getSessionUser }));

const { requireAdminUser } = await import('./adminAuth');

describe('requireAdminUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('refuses a signed-out request without calling the API', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    const result = await requireAdminUser();

    expect(result).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('refuses a non-admin whose real API check comes back 403', async () => {
    mocks.getSessionUser.mockResolvedValue({
      user_id: '1',
      email: 'follower@example.com',
      user_group: 'user',
    });
    mocks.apiFetch.mockRejectedValue(new MockApiError(403, 'Admin privileges required'));

    const result = await requireAdminUser();

    expect(result).toBeNull();
  });

  it('refuses a FORGED admin cookie: the readable cookie claims admin, the API still says 403', async () => {
    // This is the case that matters: user_group here is the client-readable
    // cookie value, editable in devtools. requireAdminUser must not trust it.
    mocks.getSessionUser.mockResolvedValue({
      user_id: '2',
      email: 'attacker@example.com',
      user_group: 'admin',
    });
    mocks.apiFetch.mockRejectedValue(new MockApiError(403, 'Admin privileges required'));

    const result = await requireAdminUser();

    expect(result).toBeNull();
  });

  it('accepts a real admin whose API check succeeds', async () => {
    const user = { user_id: '3', email: 'admin@example.com', user_group: 'admin' };
    mocks.getSessionUser.mockResolvedValue(user);
    mocks.apiFetch.mockResolvedValue({ total: 0, limit: 1, offset: 0, users: [] });

    const result = await requireAdminUser();

    expect(result).toEqual(user);
  });

  it('rethrows a non-auth failure rather than treating an outage as "not admin"', async () => {
    mocks.getSessionUser.mockResolvedValue({
      user_id: '4',
      email: 'admin@example.com',
      user_group: 'admin',
    });
    mocks.apiFetch.mockRejectedValue(new MockApiError(500, 'boom'));

    await expect(requireAdminUser()).rejects.toThrow('boom');
  });
});
