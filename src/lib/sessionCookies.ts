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

// Admin "view as user" (#250). A separate token, in its own httpOnly cookie,
// never mixed into aleonard_session: the admin's own session and refresh
// cookies stay untouched for the whole impersonation, which is what lets
// "Back to admin" end the session server-side using the ADMIN's own token
// (the impersonation token cannot end its own session - DELETE is a write,
// and every write is refused while impersonating, no exceptions) and is
// also what proxy.ts relies on to skip its refresh path while this cookie
// is present. Both cookies are set and cleared together.
export const IMPERSONATION_COOKIE = 'aleonard_impersonation';
// Non-sensitive (handles/emails only) but still httpOnly - nothing client-side
// reads it directly. The impersonation banner, the /admin block screen, and
// the escape hatch are all server-rendered, and all three read this cookie
// through the same cookies() call so they can never disagree about who is
// being viewed or whether impersonation is even active.
export const IMPERSONATION_META_COOKIE = 'aleonard_impersonation_meta';

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

interface ImpersonationPerson {
  id: string;
  // Both nullable in the API's own response schema (Optional[str] = None),
  // not just display_name - a private user is exactly the kind of account
  // likeliest to lack a handle, so this is the realistic case to handle,
  // not an edge case to shrug off. Every caller that displays a person must
  // fall back through handle -> display_name -> email -> id.
  handle: string | null;
  display_name?: string | null;
  email: string | null;
}

/** Best available way to name someone in impersonation UI, in priority order. */
export function personLabel(person: ImpersonationPerson): string {
  if (person.handle) return `@${person.handle}`;
  if (person.display_name) return person.display_name;
  if (person.email) return person.email;
  return person.id;
}

/**
 * POST /v1/admin/impersonation's response shape (OutImpersonationSession).
 * target and acting_admin are both the same OutImpersonationParty on the API
 * side - acting_admin is not missing display_name, it just isn't shown for it
 * in the UI today.
 */
export interface ImpersonationStartResponse {
  token: string;
  expires_at: string;
  session_id: string;
  target: ImpersonationPerson;
  acting_admin: ImpersonationPerson;
}

/** What the meta cookie carries - everything the banner and block screen need to render, and nothing more. */
export interface ImpersonationMeta {
  session_id: string;
  expires_at: string;
  target: ImpersonationPerson;
  acting_admin: ImpersonationPerson;
}

// A 15-minute token with no refresh path (#250) - if the clock or the
// response is ever wrong, err toward the cookie outliving the token rather
// than expiring it early and stranding the admin without the banner that
// explains why their next request just got refused.
const IMPERSONATION_FALLBACK_MAX_AGE_SECONDS = 15 * 60;

export function applyImpersonationCookies(
  store: CookieWriter,
  data: ImpersonationStartResponse,
): void {
  const secondsLeft = Math.round((new Date(data.expires_at).getTime() - Date.now()) / 1000);
  const maxAge =
    Number.isFinite(secondsLeft) && secondsLeft > 0
      ? secondsLeft
      : IMPERSONATION_FALLBACK_MAX_AGE_SECONDS;

  store.set(IMPERSONATION_COOKIE, data.token, { ...cookieOptions, maxAge });
  const meta: ImpersonationMeta = {
    session_id: data.session_id,
    expires_at: data.expires_at,
    target: data.target,
    acting_admin: data.acting_admin,
  };
  store.set(IMPERSONATION_META_COOKIE, JSON.stringify(meta), { ...cookieOptions, maxAge });
}

export function clearImpersonationCookies(store: CookieRemover): void {
  store.delete(IMPERSONATION_COOKIE);
  store.delete(IMPERSONATION_META_COOKIE);
}
