import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserTVEpisode } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Mark every episode of a show watched, or (with ?season=) just that season.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const season = new URL(request.url).searchParams.get('season');
  const qs = season ? `?season=${encodeURIComponent(season)}` : '';
  try {
    const marks = await apiFetch<UserTVEpisode[]>(
      `/v1/users/me/tv-shows/${id}/episodes/watch-all${qs}`,
      { method: 'POST' },
    );
    return NextResponse.json(marks);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Mark-all failed';
    return NextResponse.json({ error: message }, { status });
  }
}
