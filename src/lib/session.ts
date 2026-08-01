import { cookies } from 'next/headers';
import type { SessionUser } from './types';
import { REFRESH_COOKIE, SESSION_COOKIE, USER_COOKIE } from './sessionCookies';

// Cookie names, options, and the read/write helpers live in ./sessionCookies
// so middleware can share them; this module adds the `cookies()`-backed reads
// that only work inside the app.
export {
  SESSION_COOKIE,
  USER_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  applyTokenCookies,
  clearSessionCookies,
  sessionUserFrom,
} from './sessionCookies';
export type { TokenResponse } from './sessionCookies';

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
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
