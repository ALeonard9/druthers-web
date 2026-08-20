import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

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

function request() {
  return new Request('http://localhost/api/admin/impersonation/s1', { method: 'DELETE' });
}

describe('DELETE /api/admin/impersonation/[sessionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ends the named session, distinct from the callerʼs own DELETE with no id', async () => {
    mocks.apiFetch.mockResolvedValue({ ended: 1 });

    const response = await DELETE(request(), { params: Promise.resolve({ sessionId: 's1' }) });
    const body = await response.json();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/impersonation/s1', {
      method: 'DELETE',
    });
    expect(body).toEqual({ ended: 1 });
  });

  it('forwards a failure rather than a generic message', async () => {
    const { ApiError } = await import('@/lib/api');
    mocks.apiFetch.mockRejectedValue(new ApiError(403, 'Admin privileges required'));

    const response = await DELETE(request(), { params: Promise.resolve({ sessionId: 's1' }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Admin privileges required');
  });
});
