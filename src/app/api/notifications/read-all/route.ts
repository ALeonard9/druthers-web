import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UnreadCount } from '@/lib/types';

export async function PUT() {
  try {
    const count = await apiFetch<UnreadCount>(
      '/v1/users/me/notifications/read-all',
      { method: 'PUT' },
    );
    return NextResponse.json(count);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Mark-all-read failed';
    return NextResponse.json({ error: message }, { status });
  }
}
