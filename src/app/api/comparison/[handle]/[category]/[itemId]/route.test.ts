import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Saving a pick from a comparison. Three path segments come from the URL and
// all three are encoded: a handle or category with a slash in it would
// otherwise reshape the request path rather than being rejected.

// ApiError lives inside vi.hoisted: vi.mock is hoisted above the file body, so
// a class declared normally is still in its temporal dead zone when the
// factory runs and the file fails to LOAD, taking every test in it with it
// silently - the failure web#212 shipped.
const mocks = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message = 'api error') {
      super(message);
      this.status = status;
    }
  }
  return { apiFetch: vi.fn(), ApiError };
});

const { ApiError } = mocks;

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch, ApiError: mocks.ApiError }));

const ctx = {
  params: Promise.resolve({ handle: 'friend', category: 'movies', itemId: 'item-1' }),
};
const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/comparison/friend/movies/item-1', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    ctx,
  );

describe('POST /api/comparison/[handle]/[category]/[itemId]', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('saves the pick against the encoded path', async () => {
    mocks.apiFetch.mockResolvedValue({ ok: true });

    const response = await post({ destination: 'watchlist' });

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/users/me/comparison/friend/movies/item-1',
      { method: 'POST', body: { destination: 'watchlist' } },
    );
    expect(response.status).toBe(201);
  });

  it('forwards only the destination, not the whole body', async () => {
    mocks.apiFetch.mockResolvedValue({ ok: true });

    await post({ destination: 'rankings', user_id: 'someone-else' });

    expect(
      mocks.apiFetch,
      'a client-supplied field reached the api unexamined',
    ).toHaveBeenCalledWith('/v1/users/me/comparison/friend/movies/item-1', {
      method: 'POST',
      body: { destination: 'rankings' },
    });
  });

  it('preserves an upstream refusal', async () => {
    // Saving a pick from a profile the viewer may not see must be refused by
    // the api, and that refusal has to reach the user.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    expect((await post({ destination: 'watchlist' })).status).toBe(403);
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await post({ destination: 'watchlist' })).status).toBe(500);
  });
});
