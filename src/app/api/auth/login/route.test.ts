import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  applyTokenCookies: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/session', () => ({ applyTokenCookies: mocks.applyTokenCookies }));

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mocks.cookies.mockResolvedValue({});
    mocks.applyTokenCookies.mockReturnValue({ user_id: '1', email: 'a@example.com', user_group: 'user' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('surfaces "Account disabled" distinctly - correct credentials must not read as a typo', async () => {
    // This is the API's real envelope shape ({"success": false, "data": [],
    // "message": "..."}), not FastAPI's raw {"detail": ...} - an earlier
    // version of this test used {detail: ...} here, which still passed
    // against a route reading only body.detail and masked exactly this bug:
    // real disabled-account logins kept coming back as a plain "Invalid
    // credentials" in production regardless of the fix, because the API
    // never actually sends that shape.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, data: [], message: 'Account disabled' }),
          { status: 403 },
        ),
      ),
    );

    const response = await POST(jsonRequest({ email: 'a@example.com', password: 'correct' }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Account disabled');
  });

  it('surfaces rate limiting distinctly, not as a wrong password', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            data: [],
            message: 'Too many sign-in attempts - try again later',
          }),
          { status: 429 },
        ),
      ),
    );

    const response = await POST(jsonRequest({ email: 'a@example.com', password: 'correct' }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe('Too many sign-in attempts - try again later');
  });

  it('falls back to a generic 429 message if the API omits a message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));

    const response = await POST(jsonRequest({ email: 'a@example.com', password: 'correct' }));
    const body = await response.json();

    expect(body.error).toBe('Too many sign-in attempts - try again later');
  });

  it('also reads a bare {detail} body, in case a future error path returns raw FastAPI shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Account disabled' }), { status: 403 }),
      ),
    );

    const response = await POST(jsonRequest({ email: 'a@example.com', password: 'correct' }));
    const body = await response.json();

    expect(body.error).toBe('Account disabled');
  });

  it('keeps "Invalid credentials" generic for a bad password or unknown email - deliberate non-enumeration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ success: false, data: [], message: 'Invalid credentials' }),
          { status: 404 },
        ),
      ),
    );

    const response = await POST(jsonRequest({ email: 'nobody@example.com', password: 'wrong' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
  });

  it('succeeds and applies the token cookies on a good sign-in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'jwt', time_zone: 'America/Chicago' }), {
          status: 200,
        }),
      ),
    );

    const response = await POST(jsonRequest({ email: 'a@example.com', password: 'correct' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mocks.applyTokenCookies).toHaveBeenCalled();
  });
});
