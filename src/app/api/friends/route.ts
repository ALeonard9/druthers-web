import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Friend } from '@/lib/types';

// List accepted friendships.
export async function GET() {
  try {
    const friends = await apiFetch<Friend[]>('/v1/users/me/friends');
    return NextResponse.json(friends);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status });
  }
}
