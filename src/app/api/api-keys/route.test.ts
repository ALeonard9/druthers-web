import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

// API keys are long-lived credentials with no expiry, so the create path is
// the most security-sensitive write in the app: the secret is shown once and
// never again.

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

describe('/api/api-keys', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('GET lists keys', async () => {
    mocks.apiFetch.mockResolvedValue([{ id: 'k1', name: 'laptop' }]);

    const response = await GET();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/api-keys');
    expect(response.status).toBe(200);
  });

  it('POST forwards only the name', async () => {
    mocks.apiFetch.mockResolvedValue({ id: 'k1', key: 'drk_secret' });

    const response = await POST(
      new Request('http://localhost/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'laptop', user_id: 'someone-else' }),
      }),
    );

    expect(
      mocks.apiFetch,
      'a client-supplied user_id must not reach the api',
    ).toHaveBeenCalledWith('/v1/users/me/api-keys', {
      method: 'POST',
      body: { name: 'laptop' },
    });
    expect(response.status).toBe(201);
  });

  it('POST returns the created key so the secret can be shown once', async () => {
    mocks.apiFetch.mockResolvedValue({ id: 'k1', key: 'drk_secret' });

    const response = await POST(
      new Request('http://localhost/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'laptop' }),
      }),
    );

    expect(await response.json()).toMatchObject({ key: 'drk_secret' });
  });

  it('POST preserves an upstream refusal', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'refused'));

    const response = await POST(
      new Request('http://localhost/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'laptop' }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
