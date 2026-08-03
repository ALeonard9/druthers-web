import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Follow } from '@/lib/types';

// Everyone the caller follows.
export async function GET() {
  try {
    const following = await apiFetch<Follow[]>('/v1/users/me/following');
    return NextResponse.json(following);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status });
  }
}
