import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';
import { SESSION_COOKIE, USER_COOKIE, cookieOptions } from '@/lib/session';

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
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const data = await res.json();
  const store = await cookies();
  store.set(SESSION_COOKIE, data.access_token, cookieOptions);
  const user = {
    user_id: data.user_id,
    email: data.email,
    user_group: data.user_group,
  };
  // Non-sensitive; readable by the client to render the nav.
  store.set(USER_COOKIE, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
  });

  return NextResponse.json({ ok: true, user });
}
