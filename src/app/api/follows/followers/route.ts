import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Follow } from '@/lib/types';

// Everyone following the caller.
export async function GET() {
  try {
    const followers = await apiFetch<Follow[]>('/v1/users/me/followers');
    return NextResponse.json(followers);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status });
  }
}
