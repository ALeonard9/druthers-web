import { cookies } from 'next/headers';
import type { SessionUser } from './types';
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_META_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  type ImpersonationMeta,
} from './sessionCookies';

// Cookie names, options, and the read/write helpers live in ./sessionCookies
// so middleware can share them; this module adds the `cookies()`-backed reads
// that only work inside the app.
export {
  SESSION_COOKIE,
  USER_COOKIE,
  REFRESH_COOKIE,
  IMPERSONATION_COOKIE,
  IMPERSONATION_META_COOKIE,
  cookieOptions,
  applyTokenCookies,
  clearSessionCookies,
  applyImpersonationCookies,
  clearImpersonationCookies,
  sessionUserFrom,
} from './sessionCookies';
export type { TokenResponse, ImpersonationStartResponse, ImpersonationMeta } from './sessionCookies';

/**
 * The token every authenticated apiFetch call carries.
 *
 * Prefers the impersonation token when one is present - this is the single
 * point where "which identity is this request" gets decided, and everything
 * else (the banner, the /admin block screen, apiFetch's own expiry handling)
 * reads the same cookie rather than tracking its own copy of "am I
 * impersonating", so they cannot drift out of agreement (#250).
 */
export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value ?? store.get(SESSION_COOKIE)?.value;
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

/** Non-null only while an admin is actively viewing as someone else. */
export async function getImpersonationMeta(): Promise<ImpersonationMeta | null> {
  const store = await cookies();
  const raw = store.get(IMPERSONATION_META_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationMeta;
  } catch {
    return null;
  }
}
