import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Preferences } from '@/lib/types';

// Read the caller's display preferences, including account-owned shelf layout.
// Writes are partial - only sent fields change.
export async function GET() {
  try {
    const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
    return NextResponse.json(preferences);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Load failed';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  try {
    const preferences = await apiFetch<Preferences>('/v1/users/me/preferences', {
      method: 'PUT',
      body,
    });
    return NextResponse.json(preferences);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status });
  }
}
