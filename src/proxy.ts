import { NextResponse, type NextRequest } from 'next/server';
import { API_BASE_URL } from '@/lib/apiBase';
import { contentSecurityPolicy } from '@/lib/contentSecurityPolicy';
import {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  applyTokenCookies,
  clearSessionCookies,
  type TokenResponse,
} from '@/lib/sessionCookies';

/**
 * Silent session refresh (#246).
 *
 * The session cookie is sized to the access token, so its absence is the
 * signal that the token has expired - no decoding needed. When a refresh
 * token is still around we spend it here, before the request reaches any
 * page, and hand the fresh access token to the render in the same pass.
 * The user never sees a sign-in screen; the installed PWA can sit closed for
 * days and still open straight into their shelves.
 *
 * Named `proxy`, in `src/proxy.ts`: Next 16 renamed this file convention and
 * the old `middleware` names log a deprecation warning.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = contentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === 'development',
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'x-druthers-path',
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const reqInit = { request: { headers: requestHeaders } };

  const withCsp = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', cspHeader);
    return res;
  };

  if (request.cookies.get(SESSION_COOKIE)) return withCsp(NextResponse.next(reqInit));

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return withCsp(NextResponse.next(reqInit));

  let refreshed: Response;
  try {
    refreshed = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });
  } catch {
    // API unreachable - leave the cookies alone so a blip doesn't sign
    // anyone out, and let the page handle its own failure.
    return withCsp(NextResponse.next(reqInit));
  }

  if (!refreshed.ok) {
    // Revoked, expired, or replayed. Clearing the cookies drops the visitor
    // to signed-out, which the app already renders properly (landing page at
    // `/`, /login from anything protected) - a redirect from here would fight
    // that and risk a loop on public routes.
    //
    // Cleared on the request as well, so this render sees a signed-out
    // visitor instead of a stale user cookie promising a session that just
    // died.
    clearSessionCookies(request.cookies);
    const response = NextResponse.next(reqInit);
    clearSessionCookies(response.cookies);
    return withCsp(response);
  }

  const data = (await refreshed.json()) as TokenResponse;

  // Two writes, deliberately: writing to request.cookies rewrites the
  // forwarded `cookie` header, which is what this render's server components
  // read through cookies(); the response copy is what the browser keeps.
  // Without the first, the page that triggered the refresh would still
  // render signed-out.
  request.cookies.set(SESSION_COOKIE, data.access_token);
  const response = NextResponse.next(reqInit);
  applyTokenCookies(response.cookies, data);
  return withCsp(response);
}

export const config = {
  // Everything except static assets and the auth routes themselves - those
  // mint their own cookies, and /api/auth/logout must not have its token
  // silently rotated out from under it mid-request.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico|webmanifest|js|css|mp3|wav)$).*)',
  ],
};
