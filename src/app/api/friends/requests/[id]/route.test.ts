import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

// Withdrawing a request you sent.

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

const ctx = { params: Promise.resolve({ id: 'req-1' }) };

describe('/api/friends/requests/[id]', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('calls the api and returns the result', async () => {
    mocks.apiFetch.mockResolvedValue({ handle: 'stranger' });

    const response = await DELETE(new Request('http://localhost/api/friends/requests/[id]'), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/friends/requests/req-1', { method: 'DELETE' });
    expect(response.status).toBe(200);
  });

  it('preserves an upstream refusal', async () => {
    // Acting on a request that is not yours, or is already resolved, must not
    // read as success: the UI would remove it from the list either way.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(404, 'no such request'));

    const response = await DELETE(new Request('http://localhost/api/friends/requests/[id]'), ctx);

    expect(response.status).toBe(404);
  });

  it('turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect(
      (await DELETE(new Request('http://localhost/api/friends/requests/[id]'), ctx)).status,
    ).toBe(500);
  });
});
