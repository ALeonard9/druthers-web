import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// Who I follow. The other half of the asymmetric pair.

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

describe('/api/follows/following', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('GET calls the api and answers 200', async () => {
    mocks.apiFetch.mockResolvedValue({ ok: true });

    const response = await GET();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/following');
    expect(response.status).toBe(200);
  });

  it('GET preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'refused' });
  });

  it('GET turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await GET()).status).toBe(500);
  });
});
