import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  // Handle both Next.js 14 (sync) and 15 (async) params
  const p = await Promise.resolve(params);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await apiFetch<any[]>(`/v1/users/me/${p.domain}`);
    return NextResponse.json(items);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Load failed';
    return NextResponse.json({ error: message }, { status });
  }
}
