import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/apiBase';
import { REFRESH_COOKIE, clearSessionCookies } from '@/lib/session';

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  // Revoke server-side first (#246): dropping the cookie only makes *this*
  // browser forget the token, and a copy taken off the wire or out of a
  // backup would otherwise keep minting access tokens for a month.
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
      });
    } catch {
      // A sign-out that can't reach the API still has to clear the browser.
      // The token keeps its own expiry as the backstop.
    }
  }

  clearSessionCookies(store);
  return NextResponse.json({ ok: true });
}
