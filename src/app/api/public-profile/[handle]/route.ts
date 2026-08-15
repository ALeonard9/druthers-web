import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { PublicProfile } from '@/lib/types';

interface Ctx {
  params: Promise<{ handle: string }>;
}

// Client-callable proxy for /v1/public/{handle} (#279's shelf/kind/limit/
// offset), for the incremental "load more" fetches a length-control change
// or a scroll needs - the initial page load goes straight through
// fetchPublicProfile() server-side, this route is only for what happens
// after hydration.
export async function GET(request: Request, { params }: Ctx) {
  const { handle } = await params;
  const { search } = new URL(request.url);
  try {
    const profile = await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}${search}`,
    );
    return NextResponse.json(profile);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Load failed';
    return NextResponse.json({ error: message }, { status });
  }
}
