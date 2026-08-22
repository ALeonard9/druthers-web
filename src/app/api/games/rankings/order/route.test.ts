import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from './route';

// Drag-and-drop reorder. The body is the whole new order, so a route that
// mangles or partially forwards it silently reshuffles someone's ranked list.

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

const put = (body: unknown) =>
  PUT(
    new Request('http://localhost/api/games/rankings/order', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  );

describe('PUT /api/games/rankings/order', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('forwards the new order verbatim', async () => {
    const order = { game_ids: ['c', 'a', 'b'] };
    mocks.apiFetch.mockResolvedValue([]);

    const response = await put(order);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/games/rankings/order', {
      method: 'PUT',
      body: order,
    });
    expect(response.status).toBe(200);
  });

  it('returns the reordered list the api reports, not the request body', async () => {
    // The api is authoritative about the resulting ranks. Echoing the request
    // back would hide a partial write.
    mocks.apiFetch.mockResolvedValue([{ id: 'c', rank: 1 }]);

    expect(await (await put({ game_ids: ['c'] })).json()).toEqual([{ id: 'c', rank: 1 }]);
  });

  it('preserves an upstream rejection rather than reporting a saved order', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(409, 'stale order'));

    const response = await put({ game_ids: ['a'] });

    expect(response.status).toBe(409);
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await put({ game_ids: ['a'] })).status).toBe(500);
  });
});
