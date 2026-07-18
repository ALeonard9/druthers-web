import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Notification } from '@/lib/types';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const notification = await apiFetch<Notification>(
      `/v1/users/me/notifications/${id}/read`,
      { method: 'PUT' },
    );
    return NextResponse.json(notification);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Mark-read failed';
    return NextResponse.json({ error: message }, { status });
  }
}
