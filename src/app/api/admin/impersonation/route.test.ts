import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, POST } from './route';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  applyImpersonationCookies: vi.fn(),
  clearImpersonationCookies: vi.fn(),
  cookies: vi.fn(),
  cookieStore: {},
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue(mocks.cookieStore);
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
    expect(mocks.applyImpersonationCookies).toHaveBeenCalledWith(mocks.cookieStore, startResponse);
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
    mocks.cookies.mockResolvedValue(mocks.cookieStore);
  });

  it('ends the upstream session and clears the local cookies', async () => {
    mocks.apiFetch.mockResolvedValue(undefined);

    const response = await DELETE();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation', { method: 'DELETE' });
    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(mocks.cookieStore);
    expect(response.status).toBe(200);
  });

  it('still clears the local cookies even if the upstream call fails - the escape hatch must always work', async () => {
    mocks.apiFetch.mockRejectedValue(new Error('network error'));

    const response = await DELETE();

    expect(mocks.clearImpersonationCookies).toHaveBeenCalledWith(mocks.cookieStore);
    expect(response.status).toBe(200);
  });
});
