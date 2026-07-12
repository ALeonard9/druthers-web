import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { TVShowSearchResult } from '@/lib/types';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }
  try {
    const results = await apiFetch<TVShowSearchResult[]>(
      `/v1/tv-shows/search?q=${encodeURIComponent(q)}`,
    );
    return NextResponse.json(results);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status });
  }
}
