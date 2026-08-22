import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// The whole point of this route is one mapping: the URL says `tv`, the api
// says `tv-shows`. Every other domain passes through unchanged, so a
// regression here breaks exactly one of the four and looks fine in the
// other three.

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

const get = (domain: string) =>
  GET(new Request(`http://localhost/api/user/${domain}`), { params: { domain } });

describe('GET /api/user/[domain]', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('maps the tv URL segment onto the api tv-shows path', async () => {
    mocks.apiFetch.mockResolvedValue([]);

    await get('tv');

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/tv-shows');
  });

  it.each(['movies', 'books', 'games'])('passes %s through unchanged', async (domain) => {
    mocks.apiFetch.mockResolvedValue([]);

    await get(domain);

    expect(mocks.apiFetch).toHaveBeenCalledWith(`/v1/users/me/${domain}`);
  });

  it('accepts a promise for params, as Next 15 supplies', async () => {
    // The route deliberately tolerates both shapes. If the await were dropped
    // the path would interpolate "[object Promise]" and 404 at the api.
    mocks.apiFetch.mockResolvedValue([]);

    await GET(new Request('http://localhost/api/user/movies'), {
      params: Promise.resolve({ domain: 'movies' }),
    });

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/movies');
  });

  it('returns the items unchanged', async () => {
    mocks.apiFetch.mockResolvedValue([{ id: 'a' }]);

    expect(await (await get('movies')).json()).toEqual([{ id: 'a' }]);
  });

  it('preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(401, 'unauthorized'));

    expect((await get('movies')).status).toBe(401);
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await get('movies')).status).toBe(500);
  });
});
