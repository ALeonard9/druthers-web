import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import {
  SESSION_COOKIE,
  applyImpersonationCookies,
  clearImpersonationCookies,
  type ImpersonationStartResponse,
} from '@/lib/sessionCookies';
import type { AdminLiveSessionList } from '@/lib/types';

// Every live view-as session across every admin (#250 follow-up) - the
// admin console's own oversight surface, called from the audit tab. Not
// reachable while impersonating: /admin is blocked in that state, so this
// always runs with the admin's own token via the normal getToken() path.
export async function GET() {
  try {
    const data = await apiFetch<AdminLiveSessionList>('/v1/admin/impersonation');
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Could not list live sessions';
    return NextResponse.json({ error: message }, { status });
  }
}

// Starts a view-as session (#250). Admin-only by construction: it only ever
// gets called from the per-user detail view, which is already behind the
// admin route gate, and the API itself refuses a non-admin caller or a
// target who is an admin - those refusals come back with a specific
// message, forwarded here rather than flattened. A disabled target is
// deliberately allowed: diagnosing "why can't this account sign in" is
// exactly what view-as is for.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const targetUuid = typeof body?.target_uuid === 'string' ? body.target_uuid : null;
  if (!targetUuid) {
    return NextResponse.json({ error: 'Missing target_uuid' }, { status: 400 });
  }

  try {
    const data = await apiFetch<ImpersonationStartResponse>('/v1/admin/impersonation', {
      method: 'POST',
      body: { target_uuid: targetUuid, reason: body?.reason },
    });
    const store = await cookies();
    applyImpersonationCookies(store, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Could not start view-as session';
    return NextResponse.json({ error: message }, { status });
  }
}

// The escape hatch's endpoint. Idempotent per the contract.
//
// This must call the API with the ADMIN's own token, never the impersonation
// one: DELETE is a write, and every write is refused while impersonating, no
// exceptions - the impersonation token can never end its own session. The
// admin's token is read up front, before any cookie is touched, and passed
// through explicitly (apiFetch's `token` option) rather than relying on
// getToken()'s cookie lookup after clearing: cookies() in a Route Handler
// moves into "response" mode the moment ANY cookie on it is set/deleted, and
// every *other* `cookies()` read in the same request - including getToken()'s
// own, in a different module - starts reading that outgoing jar instead of
// the incoming request, so it stops seeing aleonard_session too, not just the
// cookie that was actually cleared. (An earlier version cleared first and
// trusted the fallback chain to pick up the session cookie afterward; it
// couldn't see it either, sent no Authorization header at all, and the API
// refused with a bare "Not authenticated" - worse than the original bug,
// which at least sent a token, just the wrong one.)
//
// The local cookie clear always happens - the admin must never get stuck
// unable to leave view-as mode locally because of an API hiccup - but the
// upstream failure is NOT swallowed: sessionEnded reports whether the
// session was actually revoked server-side, and the caller surfaces that
// rather than presenting a false "you are back" state.
export async function DELETE() {
  const store = await cookies();
  const adminToken = store.get(SESSION_COOKIE)?.value;
  clearImpersonationCookies(store);

  try {
    await apiFetch('/v1/admin/impersonation', { method: 'DELETE', token: adminToken });
    return NextResponse.json({ ok: true, sessionEnded: true });
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Could not confirm the session ended. It may still be active for a few more minutes.';
    return NextResponse.json({ ok: true, sessionEnded: false, warning: message });
  }
}
