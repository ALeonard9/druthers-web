import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Search proxies an upstream that needs an API key. Without one the api
// returns empty or 503, and AGENTS.md is explicit that this is expected, not
// a bug - so the route must degrade rather than throw. An empty result and a
// 500 look very different to the page rendering them.

// ApiError lives inside vi.hoisted for a reason: vi.mock is hoisted above the
// file body, so a class declared normally is still in its temporal dead zone
// when the factory runs, and the file fails to LOAD. That takes every test in
// it with it, silently - the exact failure web#212 shipped.
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

const get = (url: string) => GET(new Request(url));

describe('GET /api/movies/search', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('rejects a missing query without calling the api', async () => {
    const response = await get('http://localhost/api/movies/search');
    expect(response.status).toBe(400);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only query', async () => {
    const response = await get('http://localhost/api/movies/search?q=%20%20');
    expect(response.status).toBe(400);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('url-encodes the query rather than interpolating it raw', async () => {
    mocks.apiFetch.mockResolvedValue([]);

    await get('http://localhost/api/movies/search?q=' + encodeURIComponent('a&b=c'));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/movies/search?q=a%26b%3Dc');
  });

  it('returns an empty list as an empty list, not an error', async () => {
    // The no-API-key path. A 500 here would render as a broken page for a
    // configuration state the project treats as normal.
    mocks.apiFetch.mockResolvedValue([]);

    const response = await get('http://localhost/api/movies/search?q=nothing');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('passes results through unchanged', async () => {
    mocks.apiFetch.mockResolvedValue([{ title: 'A result' }]);

    const response = await get('http://localhost/api/movies/search?q=a');

    expect(await response.json()).toEqual([{ title: 'A result' }]);
  });

  it('preserves an upstream 503 rather than flattening it to 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(503, 'upstream unavailable'));

    const response = await get('http://localhost/api/movies/search?q=a');

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'upstream unavailable' });
  });

  it('turns an unknown failure into a 500 with a generic message', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    const response = await get('http://localhost/api/movies/search?q=a');

    expect(response.status).toBe(500);
  });
});
