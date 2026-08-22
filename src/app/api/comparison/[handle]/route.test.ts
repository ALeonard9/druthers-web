import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Comparing against another user. Visibility is decided by the api: a handle
// the viewer may not see must refuse here rather than return a partial answer.

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

const ctx = { params: Promise.resolve({ handle: 'friend' }) };
const call = () => GET(new Request('http://localhost/api/comparison/friend'), ctx);

describe('/api/comparison/friend', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('calls the api with the encoded identifier', async () => {
    mocks.apiFetch.mockResolvedValue({ status: 'ready' });

    const response = await call();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/comparison/friend');
    expect(response.status).toBe(200);
  });

  it('preserves an upstream refusal rather than flattening it', async () => {
    // A hidden profile must not degrade into an empty comparison, which would look like genuine non-overlap.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    const response = await call();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'refused' });
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await call()).status).toBe(500);
  });
});
