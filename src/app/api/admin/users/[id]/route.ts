import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminUserDetail } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await apiFetch<AdminUserDetail>(
      `/v1/admin/users/${encodeURIComponent(id)}`,
    );
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status });
  }
}
