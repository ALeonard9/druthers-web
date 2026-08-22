import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

// Listing and sending friend requests. Sending is the one write that takes a
// handle belonging to someone else, which is why the api rate-limits it as the
// brake on handle probing - so the route must forward only the handle, and
// must surface a 429 rather than looking like an ordinary failure.

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

const send = (body: unknown) =>
  POST(new Request('http://localhost/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  }));

describe('/api/friends/requests', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('GET lists pending requests', async () => {
    mocks.apiFetch.mockResolvedValue({ incoming: [], outgoing: [] });

    const response = await GET();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/friends/requests');
    expect(response.status).toBe(200);
  });

  it('POST forwards only the handle, not the whole body', async () => {
    // Anything else a client sends must not reach the api unexamined.
    mocks.apiFetch.mockResolvedValue({ message: 'sent' });

    const response = await send({ handle: 'stranger', admin: true, extra: 'ignored' });

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/friends/requests', {
      method: 'POST',
      body: { handle: 'stranger' },
    });
    expect(response.status).toBe(202);
  });

  it('POST surfaces rate limiting distinctly', async () => {
    // The cap here is the brake on probing for which handles exist. Flattening
    // a 429 into a generic failure would hide that from the user AND from us.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(429, 'too many friend requests'));

    const response = await send({ handle: 'stranger' });

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: 'too many friend requests' });
  });

  it('POST answers identically whether or not the handle exists', async () => {
    // Non-enumeration: the api gives the same acknowledgement either way, and
    // this route must not add a distinction of its own.
    mocks.apiFetch.mockResolvedValue({ message: 'sent' });

    const real = await send({ handle: 'stranger' });
    const fake = await send({ handle: 'nobody-at-all' });

    expect(real.status).toBe(fake.status);
    expect(await real.json()).toEqual(await fake.json());
  });

  it('GET turns an unknown failure into a 500', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new Error('boom'));

    expect((await GET()).status).toBe(500);
  });
});
