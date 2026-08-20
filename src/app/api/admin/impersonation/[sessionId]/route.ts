import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';

// Ends one specific live session by id, whichever admin started it - the
// console-oversight counterpart to GET /api/admin/impersonation above.
// Distinct from DELETE /api/admin/impersonation (no id), which is the web
// client's own "Back to admin" escape hatch and only ever ends sessions the
// CALLER owns. Idempotent per the API contract: an unknown, already-ended,
// or already-expired id is a 200 with {"ended": 0}, not an error.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  try {
    const data = await apiFetch(`/v1/admin/impersonation/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Could not end this session';
    return NextResponse.json({ error: message }, { status });
  }
}
