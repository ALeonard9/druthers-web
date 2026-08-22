import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Reading someone else's profile. Two things matter: the handle is encoded
// rather than interpolated raw, and the caller's query string reaches the api
// intact - the shelf/kind/limit/offset params are how "load more" works, so
// dropping them silently caps what a viewer can see.

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

const get = (handle: string, search = '') =>
  GET(
    new Request(`http://localhost/api/public-profile/${handle}${search}`),
    { params: Promise.resolve({ handle }) },
  );

describe('GET /api/public-profile/[handle]', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('requests the handle from the public endpoint', async () => {
    mocks.apiFetch.mockResolvedValue({ handle: 'follower' });

    await get('follower');

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/public/follower');
  });

  it('encodes a handle rather than interpolating it raw', async () => {
    mocks.apiFetch.mockResolvedValue({});

    await get('odd%20handle');

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/public/odd%2520handle');
  });

  it('forwards the query string so paging reaches the api', async () => {
    mocks.apiFetch.mockResolvedValue({});

    await get('follower', '?shelf=movies&limit=5&offset=10');

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/public/follower?shelf=movies&limit=5&offset=10',
    );
  });

  it('passes a hidden profile through as the api reported it', async () => {
    // Visibility is the api's call, not this route's. Turning a 404 into
    // anything else here would either leak or break the hidden-profile page.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(404, 'not found'));

    const response = await get('private-user');

    expect(response.status).toBe(404);
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await get('follower')).status).toBe(500);
  });
});
