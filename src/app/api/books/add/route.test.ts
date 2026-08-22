import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// The add route's interesting branch is the 400 fallback: creating a catalog
// row requires admin, so an ordinary user adding a title that is ALREADY in
// the catalog gets a 400 from the create and has to find the existing row
// instead. Get that wrong and adding any popular title silently fails for
// everyone except the first person to add it.

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
  POST(new Request('http://localhost/api/books/add', {
    method: 'POST',
    body: JSON.stringify(body),
  }));

describe('POST /api/books/add', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('rejects a payload missing its identifier or title', async () => {
    const response = await post({ title: 'No id' });
    expect(response.status).toBe(400);
    expect(mocks.apiFetch, 'a bad payload must not reach the api').not.toHaveBeenCalled();
  });

  it('creates the catalog row then tracks it, defaulting to the watchlist', async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ id: 'catalog-1' })
      .mockResolvedValueOnce({ id: 'tracker-1' });

    const response = await post({ isbn: '9780441013593', title: 'Dune' });

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(
      2,
      '/v1/users/me/books/catalog-1',
      { method: 'POST', body: { on_watchlist: true } },
    );
  });

  it('tracks against rankings when asked, not the watchlist', async () => {
    mocks.apiFetch
      .mockResolvedValueOnce({ id: 'catalog-1' })
      .mockResolvedValueOnce({ id: 'tracker-1' });

    await post({ isbn: '9780441013593', title: 'Dune', list: 'rankings' });

    expect(mocks.apiFetch).toHaveBeenNthCalledWith(
      2,
      '/v1/users/me/books/catalog-1',
      { method: 'POST', body: { on_rankings: true } },
    );
  });

  it('falls back to the existing row when the catalog already has the title', async () => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'already exists'))
      .mockResolvedValueOnce([{ id: 'existing-1' }])
      .mockResolvedValueOnce({ id: 'tracker-1' });

    const response = await post({ isbn: '9780441013593', title: 'Dune' });

    expect(response.status, 'an already-catalogued title must still be addable').toBe(201);
    expect(mocks.apiFetch).toHaveBeenLastCalledWith(
      '/v1/users/me/books/existing-1',
      { method: 'POST', body: { on_watchlist: true } },
    );
  });

  it('surfaces the original error when the lookup finds nothing', async () => {
    // The dangerous case: a 400 that is NOT "already exists". Swallowing it
    // would report success while nothing was tracked.
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'bad request'))
      .mockResolvedValueOnce([]);

    const response = await post({ isbn: '9780441013593', title: 'Dune' });

    expect(response.status).toBe(400);
  });

  it('passes an upstream failure through rather than reporting success', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(503, 'upstream down'));

    const response = await post({ isbn: '9780441013593', title: 'Dune' });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'upstream down' });
  });
});
