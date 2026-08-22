import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Marking one episode watched. Show progress is derived from these, so a
// silent failure shows progress that never moves.

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

const ctx = { params: Promise.resolve({ id: 'ep-1' }) };
const call = () => POST(new Request('http://localhost/api/tv/episodes/ep-1/watch'), ctx);

describe('/api/tv/episodes/ep-1/watch', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('calls the api with the encoded identifier', async () => {
    mocks.apiFetch.mockResolvedValue({ id: 'ep-1' });

    const response = await call();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/episodes/ep-1', { method: 'POST' });
    expect(response.status).toBe(201);
  });

  it('preserves an upstream refusal rather than flattening it', async () => {
    // A failed mark that reads as success desynchronises the progress bar from the data.
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
