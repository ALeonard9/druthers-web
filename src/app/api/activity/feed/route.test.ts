import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  apiFetch: mocks.apiFetch,
}));

describe('activity feed BFF route', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('forwards the cursor while fixing the social page size', async () => {
    mocks.apiFetch.mockResolvedValue({ items: [], next_cursor: 'later' });

    const response = await GET(new Request('https://www.druthers.test/api/activity/feed?cursor=opaque-cursor'));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/feed?limit=50&cursor=opaque-cursor');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], next_cursor: 'later' });
  });
});
