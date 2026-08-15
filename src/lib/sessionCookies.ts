import type { SessionUser } from './types';

// Cookie names and shapes, kept free of `next/headers` so middleware (which
// runs before the request reaches the app and has no cookies() store) can
// import them alongside the route handlers.

// The BFF stores the API's JWT in an httpOnly cookie so it is never exposed to
// client-side JavaScript. A second (readable) cookie holds non-sensitive user
// info for rendering the nav without decoding the JWT on the client.
export const SESSION_COOKIE = 'aleonard_session';
export const USER_COOKIE = 'aleonard_user';
// The refresh token (#246) - httpOnly and never read by client JS. It is the
// only credential that survives the access token's expiry, so it is also the
// only one worth stealing; it never leaves the server side of the BFF.
export const REFRESH_COOKIE = 'aleonard_refresh';

// Retire the session cookie slightly before the token inside it actually
// expires. Middleware refreshes on a *missing* session cookie, so without a
// margin a request could slip through carrying a token that expired in
// flight and get a 401 instead of a silent refresh.
const SESSION_EXPIRY_MARGIN_SECONDS = 60;

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  user_id: string;
  email: string;
  user_group: string;
  /** Raw nullable account zone, used only immediately after a fresh sign-in. */
  time_zone?: string | null;
}

// Minimal surfaces shared by the `cookies()` store, NextResponse.cookies, and
// NextRequest.cookies, so the same helpers work from a route handler or from
// the proxy. Kept separate because request cookies can only be deleted, not
// written with options - clearing genuinely needs less than writing does.
interface CookieWriter {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
  delete(name: string): unknown;
}

interface CookieRemover {
  delete(name: string): unknown;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function sessionUserFrom(data: TokenResponse): SessionUser {
  return {
    user_id: data.user_id,
    email: data.email,
    user_group: data.user_group,
  };
}

/**
 * Write the session, refresh, and user cookies from an API token response.
 *
 * Lifetimes come from the response rather than constants here: the session
 * cookie used to hardcode 12h against a 30-minute token, which is how an
 * expired session could still look signed in.
 */
export function applyTokenCookies(
  store: CookieWriter,
  data: TokenResponse,
): SessionUser {
  store.set(SESSION_COOKIE, data.access_token, {
    ...cookieOptions,
    maxAge: Math.max(data.expires_in - SESSION_EXPIRY_MARGIN_SECONDS, 60),
  });
  store.set(REFRESH_COOKIE, data.refresh_token, {
    ...cookieOptions,
    maxAge: data.refresh_expires_in,
  });
  const user = sessionUserFrom(data);
  // Non-sensitive; readable by the client to render the nav. Lives as long as
  // the refresh token - it is the "you are signed in" hint, and expiring it
  // with the access token would sign the user out visually every 30 minutes.
  store.set(USER_COOKIE, JSON.stringify(user), {
    ...cookieOptions,
    httpOnly: false,
    maxAge: data.refresh_expires_in,
  });
  return user;
}

export function clearSessionCookies(store: CookieRemover): void {
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(USER_COOKIE);
}
