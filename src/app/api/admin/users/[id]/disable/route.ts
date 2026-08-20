import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminUserDetail } from '@/lib/types';

// Both disable and enable return the full per-user detail object, so the
// client can swap its local state in place rather than refetching.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await apiFetch<AdminUserDetail>(
      `/v1/admin/users/${encodeURIComponent(id)}/disable`,
      { method: 'POST' },
    );
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    // Guard errors ("cannot disable yourself", "cannot disable another
    // admin") come back with a specific message - forward it rather than
    // flattening to a generic failure.
    const message = err instanceof ApiError ? err.message : 'Disable failed';
    return NextResponse.json({ error: message }, { status });
  }
}
