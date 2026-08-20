import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from './route';

const SESSION_COOKIE = 'aleonard_session';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  applyImpersonationCookies: vi.fn(),
  clearImpersonationCookies: vi.fn(),
  cookies: vi.fn(),
}));

function fakeCookieStore(values: Record<string, string> = {}) {
  return { get: (name: string) => (name in values ? { value: values[name] } : undefined) };
}

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
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
vi.mock('@/lib/sessionCookies', () => ({
  SESSION_COOKIE: 'aleonard_session',
  applyImpersonationCookies: mocks.applyImpersonationCookies,
  clearImpersonationCookies: mocks.clearImpersonationCookies,
}));

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/admin/impersonation', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/impersonation', () => {
  const store = fakeCookieStore();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue(store);
  });

  it('starts a session and writes the impersonation cookies', async () => {
    const startResponse = {
      token: 'view-as-jwt',
      expires_at: '2026-08-19T12:15:00Z',
      session_id: 's1',
      target: { id: 'target-1', handle: 'private-user', display_name: null, email: 'p@example.com' },
      acting_admin: { id: 'admin-1', handle: 'adam', email: 'a@example.com' },
    };
    mocks.apiFetch.mockResolvedValue(startResponse);

    const response = await POST(jsonRequest({ target_uuid: 'target-1' }));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation', {
      method: 'POST',
      body: { target_uuid: 'target-1', reason: undefined },
    });
    expect(mocks.applyImpersonationCookies).toHaveBeenCalledWith(store, startResponse);
    expect(response.status).toBe(200);
  });

  it('rejects a request with no target_uuid before calling the API', async () => {
    const response = await POST(jsonRequest({}));

    expect(response.status).toBe(400);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('forwards the API guard-error message rather than a generic failure', async () => {
    const { ApiError } = await import('@/lib/api');
    mocks.apiFetch.mockRejectedValue(new ApiError(403, 'Cannot impersonate another admin.'));

    const response = await POST(jsonRequest({ target_uuid: 'admin-target' }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Cannot impersonate another admin.');
    expect(mocks.applyImpersonationCookies).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ends the upstream session using the ADMIN token and clears the local cookies', async () => {
    const store = fakeCookieStore({ [SESSION_COOKIE]: 'admin-jwt' });
    mocks.cookies.mockResolvedValue(store);
    mocks.apiFetch.mockResolvedValue({ ended: 1 });

    const response = await DELETE();
    const body = await response.json();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation', {
      method: 'DELETE',
      token: 'admin-jwt',
    });
    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(store);
    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, sessionEnded: true });
  });

  it('reads the admin token BEFORE clearing cookies - this is the regression that let the stop call send the impersonation token', async () => {
    // A real bug, not a hypothetical: cookies() in a Route Handler moves
    // into "response" mode the moment any cookie on it is set/deleted, and
    // every OTHER `cookies()` read in the same request - including
    // getToken()'s own - starts reading that outgoing jar too, so it stops
    // seeing aleonard_session once clearImpersonationCookies has run. This
    // fake store reproduces that: .get(SESSION_COOKIE) returns the real
    // token until clear() is called, then goes blank, exactly like the
    // live store did. If the handler read the token after clearing (or
    // relied on getToken()'s own lookup at all), this test fails the same
    // way "Back to admin" did against the real API: no Authorization
    // header, "Not authenticated", session never ends.
    let cleared = false;
    const store = {
      get: (name: string) =>
        name === SESSION_COOKIE && !cleared ? { value: 'admin-jwt' } : undefined,
    };
    mocks.cookies.mockResolvedValue(store);
    mocks.clearImpersonationCookies.mockImplementation(() => {
      cleared = true;
    });
    mocks.apiFetch.mockResolvedValue({ ended: 1 });

    await DELETE();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation', {
      method: 'DELETE',
      token: 'admin-jwt',
    });
  });

  it('does not swallow an upstream failure - reports sessionEnded: false with the real message', async () => {
    const store = fakeCookieStore({ [SESSION_COOKIE]: 'admin-jwt' });
    mocks.cookies.mockResolvedValue(store);
    const { ApiError } = await import('@/lib/api');
    mocks.apiFetch.mockRejectedValue(new ApiError(403, 'This view-as session is read-only.'));

    const response = await DELETE();
    const body = await response.json();

    // The local cookies still clear unconditionally - the admin is never
    // stuck locally - but the response must not claim the session ended.
    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(store);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      sessionEnded: false,
      warning: 'This view-as session is read-only.',
    });
  });

  it('still clears the local cookies even if the upstream call fails outright (network error)', async () => {
    const store = fakeCookieStore({ [SESSION_COOKIE]: 'admin-jwt' });
    mocks.cookies.mockResolvedValue(store);
    mocks.apiFetch.mockRejectedValue(new Error('network error'));

    const response = await DELETE();
    const body = await response.json();

    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(store);
    expect(response.status).toBe(200);
    expect(body.sessionEnded).toBe(false);
  });
});

describe('GET /api/admin/impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists live sessions', async () => {
    mocks.apiFetch.mockResolvedValue({ sessions: [{ session_id: 's1' }] });

    const response = await GET();
    const body = await response.json();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation');
    expect(body.sessions).toHaveLength(1);
  });

  it('forwards a failure rather than a generic message', async () => {
    const { ApiError } = await import('@/lib/api');
    mocks.apiFetch.mockRejectedValue(new ApiError(403, 'Admin privileges required'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Admin privileges required');
  });
});
