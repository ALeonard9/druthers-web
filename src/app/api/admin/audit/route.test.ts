import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// The audit log takes filters from the query string, and the route forwards
// them through an ALLOWLIST rather than passing the caller string along. That
// is the interesting property: an operator console that forwarded arbitrary
// params would let a crafted link reach api query handling the UI never
// intended to expose.

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

const get = (qs = '') => GET(new Request(`http://localhost/api/admin/audit${qs}`));

describe('GET /api/admin/audit', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('defaults limit and offset when the caller gives none', async () => {
    mocks.apiFetch.mockResolvedValue({ entries: [] });

    await get();

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/audit?limit=50&offset=0');
  });

  it('forwards each allowlisted filter', async () => {
    mocks.apiFetch.mockResolvedValue({ entries: [] });

    await get('?actor=admin&target=follower&action=disable&limit=5&offset=10');

    const [url] = mocks.apiFetch.mock.calls[0];
    for (const part of ['actor=admin', 'target=follower', 'action=disable', 'limit=5', 'offset=10']) {
      expect(String(url)).toContain(part);
    }
  });

  it('drops a parameter that is not on the allowlist', async () => {
    mocks.apiFetch.mockResolvedValue({ entries: [] });

    await get('?actor=admin&sql=DROP&order_by=secret');

    const [url] = mocks.apiFetch.mock.calls[0];
    expect(String(url), 'an unlisted param reached the api').not.toContain('sql');
    expect(String(url)).not.toContain('order_by');
    expect(String(url)).toContain('actor=admin');
  });

  it('ignores a whitespace-only filter rather than forwarding an empty one', async () => {
    mocks.apiFetch.mockResolvedValue({ entries: [] });

    await get('?actor=%20%20');

    expect(String(mocks.apiFetch.mock.calls[0][0])).not.toContain('actor');
  });

  it('preserves an upstream refusal', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(403, 'not an admin'));

    expect((await get()).status).toBe(403);
  });
});
