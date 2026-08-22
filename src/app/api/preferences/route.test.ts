import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT } from './route';

// Preferences carries the account time zone, which every rendered date
// depends on. A silently-dropped write shows the wrong day, not an error.

// ApiError lives inside vi.hoisted: vi.mock is hoisted above the file body,
// so a class declared normally is still in its temporal dead zone when the
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

describe('/api/preferences', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('GET returns the current values', async () => {
    mocks.apiFetch.mockResolvedValue({ time_zone: 'Asia/Tokyo', ranked_list_length: 'all' });

    const response = await GET();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ time_zone: 'Asia/Tokyo', ranked_list_length: 'all' });
  });

  it('GET preserves an upstream status rather than flattening it', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'forbidden'));

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'forbidden' });
  });

  it('GET turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await GET()).status).toBe(500);
  });

  it('PUT forwards the body and returns the saved values', async () => {
    mocks.apiFetch.mockResolvedValue({ time_zone: 'Asia/Tokyo', ranked_list_length: 'all' });

    const response = await PUT(
      new Request('http://localhost/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ time_zone: 'Asia/Tokyo', ranked_list_length: 'all' }),
      }),
    );

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      '/v1/users/me/preferences',
      expect.objectContaining({ method: 'PUT', body: { time_zone: 'Asia/Tokyo', ranked_list_length: 'all' } }),
    );
    expect(response.status).toBe(200);
  });

  it('PUT preserves an upstream rejection', async () => {
    // A rejected write must not read as a successful one: the page would
    // show the new value while the api still holds the old.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(422, 'invalid'));

    const response = await PUT(
      new Request('http://localhost/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ time_zone: 'Asia/Tokyo', ranked_list_length: 'all' }),
      }),
    );

    expect(response.status).toBe(422);
  });
});
