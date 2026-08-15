import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';

interface Ctx {
  params: Promise<{ id: string }>;
}

// Decline an incoming request. Deletes the row rather than recording a
// refusal - the pair can try again later.
export async function PUT(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const ack = await apiFetch<{ message: string }>(
      `/v1/users/me/friends/requests/${id}/decline`,
      { method: 'PUT' },
    );
    return NextResponse.json(ack);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Decline failed';
    return NextResponse.json({ error: message }, { status });
  }
}
