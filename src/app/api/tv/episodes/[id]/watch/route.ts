import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserTVEpisode } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Mark an episode watched (idempotent).
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const mark = await apiFetch<UserTVEpisode>(`/v1/users/me/episodes/${id}`, {
      method: 'POST',
    });
    return NextResponse.json(mark, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Mark failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Clear the watched mark from an episode.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/episodes/${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Unmark failed';
    return NextResponse.json({ error: message }, { status });
  }
}
