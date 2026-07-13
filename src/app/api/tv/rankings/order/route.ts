import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserTVShow } from '@/lib/types';

// Persist a new ranking order (drag-and-drop). Body: { show_ids: string[] }.
export async function PUT(request: Request) {
  const body = await request.json();
  try {
    const updated = await apiFetch<UserTVShow[]>(
      '/v1/users/me/tv-shows/rankings/order',
      { method: 'PUT', body },
    );
    return NextResponse.json(updated);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Reorder failed';
    return NextResponse.json({ error: message }, { status });
  }
}
