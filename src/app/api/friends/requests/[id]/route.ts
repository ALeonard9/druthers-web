import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Withdraw a request the caller sent, before it's answered.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/friends/requests/${id}`, {
      method: 'DELETE',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Cancel failed';
    return NextResponse.json({ error: message }, { status });
  }
}
