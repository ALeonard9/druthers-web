import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// TV differs from the other three domains: the catalog dedups on tvmaze OR
// imdb, so the "already exists" fallback has to try both keys. A show found
// only by imdb would otherwise be unaddable for everyone after the first
// person, which is the kind of gap that stays invisible until someone
// complains about one specific show.

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

const post = (body: unknown) =>
  POST(new Request('http://localhost/api/tv/add', {
    method: 'POST',
    body: JSON.stringify(body),
  }));

describe('POST /api/tv/add', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('rejects a payload missing its identifier or title', async () => {
    const response = await post({ title: 'No id' });
    expect(response.status).toBe(400);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('creates the catalog row then tracks it, defaulting to the watchlist', async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ id: 'show-1' })
      .mockResolvedValueOnce({ id: 'tracker-1' });

    const response = await post({ tvmaze: 44933, title: 'Severance' });

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(
      2,
      '/v1/users/me/tv-shows/show-1',
      { method: 'POST', body: { on_watchlist: true } },
    );
  });

  it('tracks against rankings when asked', async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ id: 'show-1' })
      .mockResolvedValueOnce({ id: 'tracker-1' });

    await post({ tvmaze: 44933, title: 'Severance', list: 'rankings' });

    expect(mocks.apiFetch).toHaveBeenNthCalledWith(
      2,
      '/v1/users/me/tv-shows/show-1',
      { method: 'POST', body: { on_rankings: true } },
    );
  });

  it('re-finds an existing show by tvmaze', async () => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'already exists'))
      .mockResolvedValueOnce([{ id: 'existing-1' }])
      .mockResolvedValueOnce({ id: 'tracker-1' });

    const response = await post({ tvmaze: 44933, title: 'Severance' });

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenLastCalledWith(
      '/v1/users/me/tv-shows/existing-1',
      { method: 'POST', body: { on_watchlist: true } },
    );
  });

  it('falls back to imdb when tvmaze finds nothing', async () => {
    // The branch unique to TV. Only reached when the tvmaze lookup is empty
    // AND an imdb id was supplied.
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'already exists'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'by-imdb-1' }])
      .mockResolvedValueOnce({ id: 'tracker-1' });

    const response = await post({ tvmaze: 44933, imdb: 'tt11280740', title: 'Severance' });

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(3, '/v1/tv-shows?imdb=tt11280740');
    expect(mocks.apiFetch).toHaveBeenLastCalledWith(
      '/v1/users/me/tv-shows/by-imdb-1',
      { method: 'POST', body: { on_watchlist: true } },
    );
  });

  it('does not attempt the imdb lookup when no imdb id was given', async () => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'already exists'))
      .mockResolvedValueOnce([]);

    const response = await post({ tvmaze: 44933, title: 'Severance' });

    expect(response.status).toBe(400);
    expect(mocks.apiFetch, 'should not have tried a third lookup').toHaveBeenCalledTimes(2);
  });

  it('passes an upstream failure through rather than reporting success', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(503, 'upstream down'));

    const response = await post({ tvmaze: 44933, title: 'Severance' });

    expect(response.status).toBe(503);
  });
});
