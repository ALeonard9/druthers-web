import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// "Surprise me". The exclude parameter carries ids the caller has already been
// shown, so it must be encoded rather than interpolated raw.

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

const get = (qs = '') => GET(new Request(`http://localhost/api/bored${qs}`));

describe('GET /api/bored', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('asks for a pick with no exclusions by default', async () => {
    mocks.apiFetch.mockResolvedValue({ pick: null });

    await get();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/bored');
  });

  it('encodes the exclude list rather than interpolating it raw', async () => {
    mocks.apiFetch.mockResolvedValue({ pick: null });

    await get('?exclude=' + encodeURIComponent('a,b&c'));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/bored?exclude=a%2Cb%26c');
  });

  it('passes an empty pick through as a result, not an error', async () => {
    // Nothing left to suggest is an ordinary answer, and the page renders it
    // differently from a failure.
    mocks.apiFetch.mockResolvedValue({ pick: null });

    expect((await get()).status).toBe(200);
  });

  it('preserves an upstream refusal', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(401, 'unauthorized'));

    expect((await get()).status).toBe(401);
  });
});
