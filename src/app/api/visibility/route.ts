import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Visibility } from '@/lib/types';

// Read the caller's visibility settings.
export async function GET() {
  try {
    const visibility = await apiFetch<Visibility>('/v1/users/me/visibility');
    return NextResponse.json(visibility);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Load failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Update handle and/or per-category public flags.
export async function PUT(request: Request) {
  const body = await request.json();
  try {
    const visibility = await apiFetch<Visibility>('/v1/users/me/visibility', {
      method: 'PUT',
      body,
    });
    return NextResponse.json(visibility);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status });
  }
}
