import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import { IMPERSONATION_COOKIE, REFRESH_COOKIE, SESSION_COOKIE, USER_COOKIE } from './lib/sessionCookies';

const tokenPayload = {
  access_token: 'fresh-access',
  refresh_token: 'drr_rotated',
  expires_in: 1800,
  refresh_expires_in: 2592000,
  user_id: 'user-1',
  email: 'adam@example.com',
  user_group: 'user',
};

function request(cookies: Record<string, string>, path = '/movies') {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

function mockRefresh(response: Partial<Response> | Error) {
  const fetchMock = vi.fn();
  if (response instanceof Error) fetchMock.mockRejectedValue(response);
  else fetchMock.mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const okResponse = () => ({
  ok: true,
  json: async () => tokenPayload,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('proxy', () => {
  it('does nothing while the session cookie is still alive', async () => {
    const fetchMock = mockRefresh(okResponse());
    await proxy(request({ [SESSION_COOKIE]: 'still-good' }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does nothing for a signed-out visitor', async () => {
    const fetchMock = mockRefresh(okResponse());
    await proxy(request({}));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('spends the refresh token once the session cookie is gone', async () => {
    const fetchMock = mockRefresh(okResponse());
    await proxy(request({ [REFRESH_COOKIE]: 'drr_stored' }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/auth/refresh');
    expect(JSON.parse(init.body)).toEqual({ refresh_token: 'drr_stored' });
  });

  it('writes the rotated tokens back to the browser', async () => {
    mockRefresh(okResponse());
    const response = await proxy(request({ [REFRESH_COOKIE]: 'drr_stored' }));

    expect(response.cookies.get(SESSION_COOKIE)?.value).toBe('fresh-access');
    expect(response.cookies.get(REFRESH_COOKIE)?.value).toBe('drr_rotated');
    expect(response.cookies.get(USER_COOKIE)?.value).toContain('adam@example.com');
  });

  it('hands the fresh token to the render that triggered the refresh', async () => {
    // Without this the page would still see no session cookie and render
    // signed-out for one request after every expiry.
    mockRefresh(okResponse());
    const req = request({ [REFRESH_COOKIE]: 'drr_stored' });
    await proxy(req);

    expect(req.cookies.get(SESSION_COOKIE)?.value).toBe('fresh-access');
    expect(req.headers.get('cookie')).toContain('fresh-access');
  });

  it('clears the session when the refresh token is rejected', async () => {
    mockRefresh({ ok: false, json: async () => ({}) });
    const response = await proxy(request({ [REFRESH_COOKIE]: 'drr_revoked' }));

    // Deleting writes an expiring Set-Cookie, which is what drops the
    // visitor to signed-out instead of leaving a dead token in place.
    const setCookie = response.headers.getSetCookie().join('\n');
    expect(setCookie).toContain(`${SESSION_COOKIE}=;`);
    expect(setCookie).toContain(`${REFRESH_COOKIE}=;`);
    expect(setCookie).toContain(`${USER_COOKIE}=;`);
  });

  it('renders the rejected request as signed-out, not just the next one', async () => {
    // The user cookie is what gates the signed-in view; leaving it on the
    // forwarded request would render a session the API had just refused.
    mockRefresh({ ok: false, json: async () => ({}) });
    const req = request({
      [REFRESH_COOKIE]: 'drr_revoked',
      [USER_COOKIE]: '{"user_id":"user-1"}',
    });
    await proxy(req);

    expect(req.cookies.get(USER_COOKIE)).toBeUndefined();
    expect(req.cookies.get(REFRESH_COOKIE)).toBeUndefined();
  });

  it('leaves cookies alone when the API is unreachable', async () => {
    // A blip shouldn't sign anyone out - the token is still good.
    mockRefresh(new Error('ECONNREFUSED'));
    const response = await proxy(request({ [REFRESH_COOKIE]: 'drr_stored' }));

    expect(response.headers.getSetCookie()).toHaveLength(0);
  });

  it('injects a per-request nonce into the request headers and sets Content-Security-Policy', async () => {
    mockRefresh(okResponse());
    const req = request({ [SESSION_COOKIE]: 'still-good' });
    const response = await proxy(req);

    // The response must also have the header so the browser enforces it
    const responseCsp = response.headers.get('Content-Security-Policy');
    expect(responseCsp).toContain('nonce-');
    expect(responseCsp).toContain('strict-dynamic');
    expect(responseCsp).toContain('https://accounts.google.com');
    for (const directive of [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://image.tmdb.org https://static.tvmaze.com https://covers.openlibrary.org https://archive.org https://*.us.archive.org https://books.google.com https://books.googleusercontent.com https://images.igdb.com",
      "font-src 'self'",
      "frame-src 'self' https://accounts.google.com",
      "connect-src 'self' https://accounts.google.com",
      "form-action 'self'",
      "object-src 'none'",
    ]) {
      expect(responseCsp).toContain(directive);
    }
  });

  it('never refreshes while the impersonation cookie is present, even if the admin session cookie has also expired', async () => {
    // This is the trap #250 called out by name: if impersonation reused
    // aleonard_session, its short expiry would trigger a silent refresh with
    // the ACTING ADMIN's own refresh token, restoring the admin's identity
    // while the impersonation banner was still on screen. The impersonation
    // token lives in its own cookie, so this also proves the refresh path
    // never runs purely because that cookie is present - not just because
    // the session cookie happens to still be valid.
    const fetchMock = mockRefresh(okResponse());
    await proxy(
      request({
        [IMPERSONATION_COOKIE]: 'view-as-jwt',
        [REFRESH_COOKIE]: 'drr_admin_refresh',
        // No SESSION_COOKIE - simulates the admin's own 12h session having
        // expired mid-impersonation.
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the requested local path for disabled-shelf recovery', async () => {
    mockRefresh(okResponse());
    const response = await proxy(
      request({ [SESSION_COOKIE]: 'still-good' }, '/movies/ranking?item=42'),
    );

    expect(response.headers.get('x-middleware-request-x-druthers-path')).toBe(
      '/movies/ranking?item=42',
    );
  });
});
