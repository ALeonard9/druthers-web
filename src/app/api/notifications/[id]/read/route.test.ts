import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from './route';

// Marking one notification read. The unread count is derived from this, so a
// silent failure shows a badge that never clears.

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

const ctx = { params: Promise.resolve({ id: 'n-1' }) };
describe('/api/notifications/[id]/read', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('PUT calls the api and answers 200', async () => {
    mocks.apiFetch.mockResolvedValue({ ok: true });

    const response = await PUT(new Request('http://localhost/api/notifications/[id]/read'), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/notifications/n-1/read', { method: 'PUT' });
    expect(response.status).toBe(200);
  });

  it('PUT preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    const response = await PUT(new Request('http://localhost/api/notifications/[id]/read'), ctx);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'refused' });
  });

  it('PUT turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await PUT(new Request('http://localhost/api/notifications/[id]/read'), ctx)).status).toBe(500);
  });
});
