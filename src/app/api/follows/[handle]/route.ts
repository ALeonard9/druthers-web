import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Follow } from '@/lib/types';

interface Ctx {
  params: Promise<{ handle: string }>;
}

// Follow a public profile. Idempotent on the API side.
export async function PUT(_request: Request, { params }: Ctx) {
  const { handle } = await params;
  try {
    const follow = await apiFetch<Follow>(`/v1/users/me/following/${handle}`, {
      method: 'PUT',
    });
    return NextResponse.json(follow);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Follow failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Stop following someone — allowed even if they're no longer public.
export async function DELETE(_request: Request, { params }: Ctx) {
  const { handle } = await params;
  try {
    await apiFetch<void>(`/v1/users/me/following/${handle}`, {
      method: 'DELETE',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Unfollow failed';
    return NextResponse.json({ error: message }, { status });
  }
}
