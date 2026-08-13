import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { SocialActivityPage } from '@/lib/types';

// The API owns cursor validation and visibility enforcement. This route only
// keeps the browser on the same authenticated BFF boundary as other UI fetches.
export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get('cursor');
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.set('cursor', cursor);

  try {
    const page = await apiFetch<SocialActivityPage>(`/v1/users/me/feed?${params}`);
    return NextResponse.json(page);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Feed request failed';
    return NextResponse.json({ error: message }, { status });
  }
}
