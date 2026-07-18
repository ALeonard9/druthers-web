import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';
import { SESSION_COOKIE, USER_COOKIE, cookieOptions } from '@/lib/session';

// BFF Google sign-in: forward the Google Identity Services ID token (credential)
// to the API, then store the returned JWT in an httpOnly cookie.
export async function POST(request: Request) {
  const { credential } = await request.json();
  if (!credential) {
    return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
  }

  const res = await fetch(`${API_BASE_URL}/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body?.detail ?? body?.message ?? 'Google sign-in failed';
    return NextResponse.json({ error: detail }, { status: 401 });
  }

  const data = await res.json();
  const store = await cookies();
  store.set(SESSION_COOKIE, data.access_token, cookieOptions);
  const user = {
    user_id: data.user_id,
    email: data.email,
    user_group: data.user_group,
  };
  store.set(USER_COOKIE, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
  });
  return NextResponse.json({ ok: true, user });
}
