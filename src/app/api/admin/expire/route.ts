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

  const destination = target
    ? `/admin/users/${encodeURIComponent(target)}?impersonation_expired=${encodeURIComponent(handle ?? '')}`
    : '/admin';
  return NextResponse.redirect(new URL(destination, request.url));
}
