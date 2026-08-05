import { NextResponse } from 'next/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { UserComparison } from '@/lib/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  try {
    const comparison = await apiFetch<UserComparison>(
      `/v1/users/me/comparison/${encodeURIComponent(handle)}`,
    );
    return NextResponse.json(comparison);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Comparison failed';
    return NextResponse.json({ error: message }, { status });
  }
}
