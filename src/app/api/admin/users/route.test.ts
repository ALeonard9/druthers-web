import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

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

function request(qs: string) {
  return new Request(`http://localhost/api/admin/users${qs}`);
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiFetch.mockResolvedValue({ total: 0, limit: 50, offset: 0, users: [] });
  });

  it('defaults limit and offset with no query at all', async () => {
    await GET(request(''));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/users?limit=50&offset=0');
  });

  it('passes q, status, sort and direction through when present', async () => {
    await GET(request('?q=foll&status=disabled&sort=last_tracked&direction=asc'));

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/admin/users?limit=50&offset=0&q=foll&status=disabled&sort=last_tracked&direction=asc',
    );
  });

  it('omits status, sort and direction when absent rather than sending empty values', async () => {
    await GET(request('?limit=10&offset=20'));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/users?limit=10&offset=20');
  });
});
