import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  applyTokenCookies: vi.fn(),
  cookieStore: { set: vi.fn(), delete: vi.fn() },
  cookies: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/api', () => ({ API_BASE_URL: 'https://api.druthers.test' }));
vi.mock('@/lib/session', () => ({ applyTokenCookies: mocks.applyTokenCookies }));

describe('Google auth route timing', () => {
  beforeEach(() => {
    mocks.cookies.mockReset().mockResolvedValue(mocks.cookieStore);
    mocks.applyTokenCookies.mockReset().mockReturnValue({
      user_id: 'viewer',
      email: 'viewer@example.com',
      user_group: 'user',
    });
    vi.unstubAllGlobals();
  });

  it('exposes the upstream token-exchange span on a successful sign-in', async () => {
    const tokenResponse = {
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 1_800,
      refresh_expires_in: 86_400,
      user_id: 'viewer',
      email: 'viewer@example.com',
      user_group: 'user',
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(tokenResponse));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      new Request('https://www.druthers.test/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: 'google-id-token' }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith('https://api.druthers.test/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'google-id-token' }),
      cache: 'no-store',
    });
    expect(response.headers.get('Server-Timing')).toMatch(
      /^druthers_auth_api;dur=\d+\.\d;desc="Google token exchange"$/,
    );
    expect(mocks.applyTokenCookies).toHaveBeenCalledWith(mocks.cookieStore, tokenResponse);
  });

  it('includes the upstream span when Google authentication is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({ detail: 'Invalid Google credential' }, { status: 401 }),
      ),
    );

    const response = await POST(
      new Request('https://www.druthers.test/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: 'bad-token' }),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('Server-Timing')).toContain('druthers_auth_api;dur=');
    expect(await response.json()).toEqual({ error: 'Invalid Google credential' });
    expect(mocks.applyTokenCookies).not.toHaveBeenCalled();
  });

  it('preserves the measured span when the authentication service is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    const response = await POST(
      new Request('https://www.druthers.test/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: 'google-id-token' }),
      }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('Server-Timing')).toContain('druthers_auth_api;dur=');
    expect(await response.json()).toEqual({ error: 'Authentication service unavailable' });
  });
});
