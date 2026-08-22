import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './route';

// Revoking an API key. A revoke that reports success while the key still
// authenticates is a credential that cannot be withdrawn.

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

const ctx = { params: Promise.resolve({ id: 'key-1' }) };
describe('/api/api-keys/[id]', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('DELETE calls the api and answers 200', async () => {
    mocks.apiFetch.mockResolvedValue({ ok: true });

    const response = await DELETE(new Request('http://localhost/api/api-keys/[id]'), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/api-keys/key-1', { method: 'DELETE' });
    expect(response.status).toBe(200);
  });

  it('DELETE preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    const response = await DELETE(new Request('http://localhost/api/api-keys/[id]'), ctx);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'refused' });
  });

  it('DELETE turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await DELETE(new Request('http://localhost/api/api-keys/[id]'), ctx)).status).toBe(500);
  });
});
