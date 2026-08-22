import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Disabling an account. The guard errors (cannot disable yourself, cannot
// disable another admin) arrive as api refusals, and the console has to show
// them rather than reporting a disable that never happened.

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

const ctx = { params: Promise.resolve({ id: 'u-1' }) };
const call = () => POST(new Request('http://localhost/api/admin/users/u-1/disable'), ctx);

describe('/api/admin/users/u-1/disable', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('calls the api with the encoded identifier', async () => {
    mocks.apiFetch.mockResolvedValue({ handle: 'disposable' });

    const response = await call();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/users/u-1/disable', { method: 'POST' });
    expect(response.status).toBe(200);
  });

  it('preserves an upstream refusal rather than flattening it', async () => {
    // This is the #341 guard surfacing. Flattening it would show a disabled account that is still active.
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
