import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';
import { applyTokenCookies } from '@/lib/session';

// BFF login: exchange email/password for a JWT at the API's OAuth2 token
// endpoint, then store it in an httpOnly cookie. The token never reaches the
// browser's JavaScript.
export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE_URL}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    // The API tells apart three different failures - a bad password/unknown
    // email (404 "Invalid credentials"), a disabled account (403 "Account
    // disabled"), and rate limiting (429 "Too many sign-in attempts - try
    // again later") - and this used to flatten all three into "Invalid
    // credentials". That is deliberate for the first case (account
    // non-enumeration: a real email with the wrong password should look
    // identical to an email that doesn't exist), but the other two are real,
    // actionable, distinct reasons the admin and Adam both need to see -
    // otherwise a disabled account gets misdiagnosed as a typo and a
    // rate-limited retry looks like the password is still wrong.
    const body = await res.json().catch(() => null);
    // The API wraps HTTPException details in its own envelope
    // ({"success": false, "data": [], "message": "..."}), not FastAPI's raw
    // {"detail": ...} - checked both here since lib/api.ts's own error
    // parsing does the same, for the same reason.
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.detail === 'string'
          ? body.detail
          : null;
    if (res.status === 403 && message) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (res.status === 429) {
      return NextResponse.json(
        { error: message ?? 'Too many sign-in attempts - try again later' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const data = await res.json();
  const user = applyTokenCookies(await cookies(), data);

  return NextResponse.json({ ok: true, user, time_zone: data.time_zone });
}
