import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  getImpersonationMeta: vi.fn(),
  redirect: vi.fn(() => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT' });
  }),
}));

vi.mock('./session', () => ({
  getToken: mocks.getToken,
  getImpersonationMeta: mocks.getImpersonationMeta,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const { apiFetch, ApiError } = await import('./api');

const IMPERSONATION_META = {
  session_id: 's1',
  expires_at: '2026-08-19T12:15:00Z',
  target: { id: 'target-1', handle: 'private-user', display_name: null, email: 'p@example.com' },
  acting_admin: { id: 'admin-1', handle: 'adam', email: 'a@example.com' },
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe('apiFetch - impersonation expiry (#250)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('redirects to /api/admin/expire on a 401 while impersonating', async () => {
    mocks.getToken.mockResolvedValue('expired-view-as-jwt');
    mocks.getImpersonationMeta.mockResolvedValue(IMPERSONATION_META);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'Not authenticated' })));

    await expect(apiFetch('/v1/movies')).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/api/admin/expire?target=target-1&handle=private-user',
    );
  });

  it('omits the handle param rather than sending the literal string "null" for a handle-less target', async () => {
    mocks.getToken.mockResolvedValue('expired-view-as-jwt');
    mocks.getImpersonationMeta.mockResolvedValue({
      ...IMPERSONATION_META,
      target: { ...IMPERSONATION_META.target, handle: null },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'Not authenticated' })));

    await expect(apiFetch('/v1/movies')).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith('/api/admin/expire?target=target-1');
  });

  it('redirects on a 403 GET while impersonating - reads are never legitimately blocked', async () => {
    mocks.getToken.mockResolvedValue('expired-view-as-jwt');
    mocks.getImpersonationMeta.mockResolvedValue(IMPERSONATION_META);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(403, { message: 'refused' })));

    await expect(apiFetch('/v1/movies')).rejects.toThrow('NEXT_REDIRECT');
  });

  it('does not redirect on a 403 for a write while impersonating - that is the expected read-only refusal', async () => {
    mocks.getToken.mockResolvedValue('view-as-jwt');
    mocks.getImpersonationMeta.mockResolvedValue(IMPERSONATION_META);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(403, { message: 'Read-only while impersonating' })),
    );

    await expect(apiFetch('/v1/movies/1/rank', { method: 'POST', body: {} })).rejects.toThrow(
      'Read-only while impersonating',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('does not redirect on a 401 with no impersonation active - normal auth failure', async () => {
    mocks.getToken.mockResolvedValue(undefined);
    mocks.getImpersonationMeta.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'Not authenticated' })));

    await expect(apiFetch('/v1/movies')).rejects.toThrow('Not authenticated');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('does not check impersonation at all for an unauthenticated call', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(IMPERSONATION_META);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'bad login' })));

    await expect(apiFetch('/v1/auth/token', { auth: false })).rejects.toThrow(ApiError);
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.getImpersonationMeta).not.toHaveBeenCalled();
  });
});

describe('apiFetch - explicit token override', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the explicit token instead of calling getToken() - needed by the impersonation stop endpoint (#250), which must never resolve identity through the cookie store after mutating it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/v1/admin/impersonation', { method: 'DELETE', token: 'explicit-admin-jwt' });

    expect(mocks.getToken).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer explicit-admin-jwt');
  });
});
