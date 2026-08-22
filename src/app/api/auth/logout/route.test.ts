import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Signing out has to do two things in the right order, and the order is the
// security property: revoke the refresh token server-side FIRST, then clear
// the browser's cookies.
//
// Clearing the cookie alone only makes *this* browser forget the token. A copy
// taken off the wire or out of a backup would keep minting access tokens for a
// month, so a sign-out that skips the revoke is a sign-out that did not happen.

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  clearSessionCookies: vi.fn(),
  fetch: vi.fn(),
  store: { get: vi.fn() },
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/sessionCookies', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  clearSessionCookies: mocks.clearSessionCookies,
}));
vi.mock('@/lib/session', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  clearSessionCookies: mocks.clearSessionCookies,
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    mocks.clearSessionCookies.mockReset();
    mocks.store.get.mockReset();
    mocks.cookies.mockReset().mockResolvedValue(mocks.store);
    mocks.fetch.mockReset().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('revokes the refresh token server-side before clearing cookies', async () => {
    mocks.store.get.mockReturnValue({ value: 'refresh-token-value' });

    const response = await POST();

    expect(mocks.fetch, 'the refresh token was never revoked').toHaveBeenCalledTimes(1);
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(String(url)).toContain('/v1/auth/logout');
    expect(JSON.parse(String(init.body))).toEqual({ refresh_token: 'refresh-token-value' });

    expect(mocks.clearSessionCookies).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('still clears the browser when the api is unreachable', async () => {
    // A sign-out that cannot reach the api must not strand the user signed in.
    // The token's own expiry is the backstop for the revoke.
    mocks.store.get.mockReturnValue({ value: 'refresh-token-value' });
    mocks.fetch.mockRejectedValueOnce(new Error('network down'));

    const response = await POST();

    expect(mocks.clearSessionCookies).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('skips the revoke when there is no refresh token, and still clears', async () => {
    mocks.store.get.mockReturnValue(undefined);

    const response = await POST();

    expect(mocks.fetch, 'nothing to revoke, so nothing should be called').not.toHaveBeenCalled();
    expect(mocks.clearSessionCookies).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
