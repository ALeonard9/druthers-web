import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Revoke (delete) a key — takes effect immediately.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/api-keys/${id}`, { method: 'DELETE' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Revoke failed';
    return NextResponse.json({ error: message }, { status });
  }
}
