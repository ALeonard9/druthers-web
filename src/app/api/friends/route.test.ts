import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as route from './route';

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

describe('/api/friends', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('GET lists the current user friends', async () => {
    mocks.apiFetch.mockResolvedValue([{ handle: 'friend' }]);

    const response = await route.GET();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/friends');
    expect(await response.json()).toEqual([{ handle: 'friend' }]);
  });

  it('GET returns an empty list as an empty list', async () => {
    // A user with no friends is an ordinary state, not an error, and the
    // page renders it differently from a failure.
    mocks.apiFetch.mockResolvedValue([]);

    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('GET preserves an upstream status', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(401, 'unauthorized'));

    expect((await route.GET()).status).toBe(401);
  });

  it('GET turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await route.GET()).status).toBe(500);
  });
});
