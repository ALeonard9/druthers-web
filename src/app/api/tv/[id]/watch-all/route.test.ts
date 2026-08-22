import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Marking a whole show or a whole season watched. The season parameter is the
// difference between "this season" and "everything", so dropping it marks far
// more than the user asked for. That is a destructive mistake, not a cosmetic
// one, and it is not obviously wrong on screen afterwards.

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

const ctx = { params: Promise.resolve({ id: 'show-1' }) };
const post = (qs = '') =>
  POST(new Request(`http://localhost/api/tv/show-1/watch-all${qs}`), ctx);

describe('POST /api/tv/[id]/watch-all', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('marks the whole show when no season is given', async () => {
    mocks.apiFetch.mockResolvedValue([]);

    await post();

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/users/me/tv-shows/show-1/episodes/watch-all',
      { method: 'POST' },
    );
  });

  it('scopes to one season when asked', async () => {
    mocks.apiFetch.mockResolvedValue([]);

    await post('?season=2');

    expect(
      mocks.apiFetch,
      'the season was dropped, which would mark the entire show',
    ).toHaveBeenCalledWith(
      '/v1/users/me/tv-shows/show-1/episodes/watch-all?season=2',
      { method: 'POST' },
    );
  });

  it('preserves an upstream refusal', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(404, 'no such show'));

    expect((await post()).status).toBe(404);
  });
});
