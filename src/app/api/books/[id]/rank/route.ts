import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserBook } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Place a book at an exact position in the ranked list. Body: { position }.
export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  const { position } = await request.json();
  const pos = Number(position);
  if (!Number.isFinite(pos) || pos < 1) {
    return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
  }
  try {
    const updated = await apiFetch<UserBook>(`/v1/users/me/books/${id}/rank`, {
      method: 'PUT',
      body: { position: Math.floor(pos) },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Placement failed';
    return NextResponse.json({ error: message }, { status });
  }
}
