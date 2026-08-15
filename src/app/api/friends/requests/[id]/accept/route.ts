import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Friend } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Accept an incoming request - both sides count as friends from here.
export async function PUT(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const friend = await apiFetch<Friend>(
      `/v1/users/me/friends/requests/${id}/accept`,
      { method: 'PUT' },
    );
    return NextResponse.json(friend);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Accept failed';
    return NextResponse.json({ error: message }, { status });
  }
}
