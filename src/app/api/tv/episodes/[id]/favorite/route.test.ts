import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, DELETE } from './route';

// Favouriting an episode, and un-favouriting it. The pair has to be
// symmetric: an un-favourite that quietly succeeds while the flag survives
// leaves a star the user cannot remove.

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
const req = () => new Request('http://localhost/api/tv/episodes/ep-1/favorite');

describe('/api/tv/episodes/[id]/favorite', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('POST favourites the episode', async () => {
    mocks.apiFetch.mockResolvedValue({ id: 'ep-1' });

    const response = await POST(req(), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/users/me/episodes/ep-1/favorite',
      { method: 'POST' },
    );
    expect(response.status).toBeLessThan(300);
  });

  it('DELETE un-favourites the episode', async () => {
    mocks.apiFetch.mockResolvedValue(undefined);

    const response = await DELETE(req(), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/users/me/episodes/ep-1/favorite',
      { method: 'DELETE' },
    );
    expect(response.status).toBeLessThan(300);
  });

  it('DELETE surfaces a failure rather than claiming the star is gone', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(404, 'not favourited'));

    expect((await DELETE(req(), ctx)).status).toBe(404);
  });

  it('POST turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await POST(req(), ctx)).status).toBe(500);
  });
});
