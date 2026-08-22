import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Global search. The encoding case is the one that matters: a raw
// interpolation of a query containing & or = would silently truncate the
// search at the api, returning plausible-looking wrong results rather than an
// error.

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

const get = (qs: string) => GET(new Request(`http://localhost/api/search${qs}`));

describe('GET /api/search', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it.each([['absent', ''], ['empty', '?q='], ['whitespace only', '?q=%20%20']])(
    'rejects a %s query without calling the api',
    async (_label, qs) => {
      const response = await get(qs);

      expect(response.status).toBe(400);
      expect(mocks.apiFetch).not.toHaveBeenCalled();
    },
  );

  it('encodes the query rather than interpolating it raw', async () => {
    mocks.apiFetch.mockResolvedValue({});

    await get('?q=' + encodeURIComponent('a&b=c'));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search?q=a%26b%3Dc');
  });

  it('returns the cross-domain shape unchanged', async () => {
    const payload = { query: 'x', movies: [], tv_shows: [], books: [], games: [] };
    mocks.apiFetch.mockResolvedValue(payload);

    expect(await (await get('?q=x')).json()).toEqual(payload);
  });

  it('preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(429, 'too many searches'));

    const response = await get('?q=x');

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: 'too many searches' });
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await get('?q=x')).status).toBe(500);
  });
});
