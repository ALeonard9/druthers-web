import { NextResponse } from 'next/server';
import { ApiError, apiFetch } from '@/lib/api';

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ handle: string; category: string; itemId: string }>;
  },
) {
  const { handle, category, itemId } = await params;
  const body = await request.json();
  try {
    const saved = await apiFetch(
      `/v1/users/me/comparison/${encodeURIComponent(handle)}/${encodeURIComponent(category)}/${encodeURIComponent(itemId)}`,
      { method: 'POST', body: { destination: body.destination } },
    );
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Could not save that pick';
    return NextResponse.json({ error: message }, { status });
  }
}
