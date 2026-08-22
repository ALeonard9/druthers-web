import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from './route';

// Placing an item at an exact position. The validation matters more than the
// happy path: a position of 0 or a non-number reaching the api would either
// error obscurely or land the item somewhere nobody asked for.

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

const ctx = { params: Promise.resolve({ id: 'catalog-1' }) };
const put = (body: unknown) =>
  PUT(
    new Request('http://localhost/api/movies/catalog-1/rank', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
    ctx,
  );

describe('PUT /api/movies/[id]/rank', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('places the item at the requested position', async () => {
    mocks.apiFetch.mockResolvedValue({ rank: 3 });

    const response = await put({ position: 3 });

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/movies/catalog-1/rank', {
      method: 'PUT',
      body: { position: 3 },
    });
    expect(response.status).toBe(200);
  });

  it('floors a fractional position rather than passing it through', async () => {
    mocks.apiFetch.mockResolvedValue({ rank: 2 });

    await put({ position: 2.7 });

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/movies/catalog-1/rank', {
      method: 'PUT',
      body: { position: 2 },
    });
  });

  it('accepts a numeric string, since form values arrive as strings', async () => {
    mocks.apiFetch.mockResolvedValue({ rank: 5 });

    await put({ position: '5' });

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/movies/catalog-1/rank', {
      method: 'PUT',
      body: { position: 5 },
    });
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['not a number', 'abc'],
    ['missing', undefined],
  ])('rejects a %s position without calling the api', async (_label, position) => {
    const response = await put({ position });

    expect(response.status).toBe(400);
    expect(mocks.apiFetch, 'an invalid position must not reach the api').not.toHaveBeenCalled();
  });

  it('preserves an upstream rejection', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(409, 'conflict'));

    const response = await put({ position: 1 });

    expect(response.status).toBe(409);
  });
});
