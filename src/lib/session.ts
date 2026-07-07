import { cookies } from 'next/headers';
import type { SessionUser } from './types';

// The BFF stores the API's JWT in an httpOnly cookie so it is never exposed to
// client-side JavaScript. A second (readable) cookie holds non-sensitive user
// info for rendering the nav without decoding the JWT on the client.
export const SESSION_COOKIE = 'aleonard_session';
export const USER_COOKIE = 'aleonard_user';

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // 30 minutes, matching the API token lifetime.
  maxAge: 60 * 30,
};
