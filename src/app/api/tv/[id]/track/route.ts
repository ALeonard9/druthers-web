import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserTVShow } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Add a show to a list (idempotent merge) — used when it isn't tracked yet.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  try {
    const created = await apiFetch<UserTVShow>(`/v1/users/me/tv-shows/${id}`, {
      method: 'POST',
      body,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Add failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Update the current user's tracker for a show (list flags, notes, rank).
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await apiFetch<UserTVShow>(`/v1/users/me/tv-shows/${id}`, {
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

// Remove a show from the current user's list.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/tv-shows/${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status });
  }
}
