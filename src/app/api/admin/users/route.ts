import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminUserListResponse } from '@/lib/types';

// Proxy for the admin directory search box (client-side, debounced), and for
// the directory page's own initial load. Refuses independently of the
// `/admin` route gate: apiFetch attaches the caller's own session token, and
// the API rejects non-admins with 403 regardless of what this route does.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get('q')?.trim();
  const limit = params.get('limit') ?? '50';
  const offset = params.get('offset') ?? '0';

  const query = new URLSearchParams({ limit, offset });
  if (q) query.set('q', q);

  try {
    const data = await apiFetch<AdminUserListResponse>(`/v1/admin/users?${query}`);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Directory search failed';
    return NextResponse.json({ error: message }, { status });
  }
}
