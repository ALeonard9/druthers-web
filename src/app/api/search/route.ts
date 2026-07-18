import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { GlobalSearch } from '@/lib/types';

// Cross-domain search proxy (client components refine queries from /search).
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  if (!q.trim()) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }
  try {
    const results = await apiFetch<GlobalSearch>(
      `/v1/search?q=${encodeURIComponent(q)}`,
    );
    return NextResponse.json(results);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status });
  }
}
