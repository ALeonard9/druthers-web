import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser, clearSessionCookies } from '@/lib/session';
import { cookies } from 'next/headers';

// The API intentionally requires the account UUID. Resolve it from the
// server-side session rather than accepting an identifier from the browser.
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  try {
    await apiFetch<void>(`/v1/users/${user.user_id}`, { method: 'DELETE' });
    clearSessionCookies(await cookies());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Could not delete account';
    return NextResponse.json({ error: message }, { status });
  }
}
