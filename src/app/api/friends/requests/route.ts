import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { PendingFriendRequests } from '@/lib/types';

// Both directions of pending requests in one call.
export async function GET() {
  try {
    const requests = await apiFetch<PendingFriendRequests>(
      '/v1/users/me/friends/requests',
    );
    return NextResponse.json(requests);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Send a request to an exact handle. The API answers the same 202 whether or
// not the handle resolved to anybody - this proxy passes that straight
// through rather than trying to distinguish the cases itself.
export async function POST(request: Request) {
  const body = await request.json();
  try {
    const ack = await apiFetch<{ message: string }>(
      '/v1/users/me/friends/requests',
      { method: 'POST', body: { handle: body.handle } },
    );
    return NextResponse.json(ack, { status: 202 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Send failed';
    return NextResponse.json({ error: message }, { status });
  }
}
