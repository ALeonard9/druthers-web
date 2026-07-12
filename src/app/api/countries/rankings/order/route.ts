import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserCountry } from '@/lib/types';

// Persist a new visited order (drag-and-drop). Body: { country_ids: string[] }.
export async function PUT(request: Request) {
  const body = await request.json();
  try {
    const updated = await apiFetch<UserCountry[]>(
      '/v1/users/me/countries/rankings/order',
      { method: 'PUT', body },
    );
    return NextResponse.json(updated);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Reorder failed';
    return NextResponse.json({ error: message }, { status });
  }
}
