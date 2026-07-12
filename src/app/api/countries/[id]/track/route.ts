import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserCountry } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Add a country to a list (idempotent merge) — used when it isn't tracked yet.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  try {
    const created = await apiFetch<UserCountry>(`/v1/users/me/countries/${id}`, {
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

// Update the tracker (list flags, notes, rank, first_visited).
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await apiFetch<UserCountry>(`/v1/users/me/countries/${id}`, {
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

// Remove a country from the current user's lists.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/countries/${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status });
  }
}
