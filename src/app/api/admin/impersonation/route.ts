import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import {
  applyImpersonationCookies,
  clearImpersonationCookies,
  type ImpersonationStartResponse,
} from '@/lib/sessionCookies';

// Starts a view-as session (#250). Admin-only by construction: it only ever
// gets called from the per-user detail view, which is already behind the
// admin route gate, and the API itself refuses a non-admin caller, a target
// who is an admin, or a disabled target - those refusals come back with a
// specific message, forwarded here rather than flattened.
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

// The escape hatch's endpoint. Idempotent per the contract, and this side
// always clears the local cookies even if the upstream call fails or there
// was never a session to begin with - the admin must never get stuck unable
// to leave view-as mode because of an API hiccup.
export async function DELETE() {
  try {
    await apiFetch('/v1/admin/impersonation', { method: 'DELETE' });
  } catch {
    // Best-effort - see comment above.
  }
  const store = await cookies();
  clearImpersonationCookies(store);
  return NextResponse.json({ ok: true });
}
