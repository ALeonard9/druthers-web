import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clearImpersonationCookies } from '@/lib/sessionCookies';

/**
 * Where apiFetch redirects a Server Component render that hit a 401/403
 * while impersonating (#250).
 *
 * A plain page render cannot mutate cookies - only a Route Handler or Server
 * Action can - so the cookie clear has to happen here rather than at the
 * point apiFetch notices the expiry. Lands the admin back on the target's
 * own detail page (not /admin) with a message, and does NOT touch the
 * admin's own session cookies: this is an identity drop, not a sign-out.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('target');
  const handle = url.searchParams.get('handle');

  const store = await cookies();
  clearImpersonationCookies(store);

  if (!target) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // `impersonation_expired=1` is the marker the detail page checks - kept
  // separate from the handle because a target can genuinely have no handle
  // (nullable in the API's own schema), and the expiry notice still needs
  // to show in that case rather than silently disappearing along with the
  // empty value.
  const qs = new URLSearchParams({ impersonation_expired: '1' });
  if (handle) qs.set('impersonation_handle', handle);
  return NextResponse.redirect(
    new URL(`/admin/users/${encodeURIComponent(target)}?${qs}`, request.url),
  );
}
