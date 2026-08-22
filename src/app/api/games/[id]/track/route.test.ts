import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, PUT, DELETE } from './route';

// The tracker route is the write path behind every shelf action: adding,
// editing a note or completed date, and removing. A silent failure here shows
// the user their change and loses it, which is worse than an error.

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

const ctx = { params: Promise.resolve({ id: 'catalog-1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/games/catalog-1/track', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('/api/games/[id]/track', () => {
  beforeEach(() => mocks.apiFetch.mockReset());

  it('POST tracks the item and answers 201', async () => {
    mocks.apiFetch.mockResolvedValue({ id: 'tracker-1' });

    const response = await POST(req({ on_watchlist: true }), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/games/catalog-1', {
      method: 'POST',
      body: { on_watchlist: true },
    });
    expect(response.status).toBe(201);
  });

  it('PUT forwards the edited fields verbatim', async () => {
    // Notes and completed dates come through here. Dropping a field silently
    // is the failure mode, so assert the exact body rather than that it was
    // merely called.
    mocks.apiFetch.mockResolvedValue({ id: 'tracker-1' });

    const response = await PUT(req({ notes: 'a note', completed_at: '2024-03-15' }), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/games/catalog-1', {
      method: 'PUT',
      body: { notes: 'a note', completed_at: '2024-03-15' },
    });
    expect(response.status).toBe(200);
  });

  it('PUT preserves an upstream rejection instead of reporting success', async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(422, 'invalid'));

    const response = await PUT(req({ notes: 'x' }), ctx);

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: 'invalid' });
  });

  it('DELETE removes the tracker row', async () => {
    mocks.apiFetch.mockResolvedValue(undefined);

    const response = await DELETE(req({}), ctx);

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/games/catalog-1', {
      method: 'DELETE',
    });
    expect(response.status).toBe(200);
  });

  it('DELETE surfaces a failure rather than claiming the item is gone', async () => {
    // A delete that reports ok while the row survives is how a shelf grows
    // items the user thought they removed.
    mocks.apiFetch.mockRejectedValueOnce(new ApiError(404, 'not tracked'));

    const response = await DELETE(req({}), ctx);

    expect(response.status).toBe(404);
  });
});
