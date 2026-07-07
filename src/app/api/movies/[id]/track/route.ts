import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserMovie } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Update the current user's tracker for a movie (watched flag, notes, rank).
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await apiFetch<UserMovie>(`/v1/users/me/movies/${id}`, {
      method: 'PUT',
      body,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Remove a movie from the current user's list.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/movies/${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status });
  }
}
