import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { BoredResponse } from '@/lib/types';

// Random pick off the user's watchlists/bucket lists. A BFF route (rather
// than a direct server-component fetch) because the "Shuffle" button
// re-rolls from a Client Component, which can't reach the API directly.
export async function GET(request: Request) {
  const exclude = new URL(request.url).searchParams.get('exclude');
  const qs = exclude ? `?exclude=${encodeURIComponent(exclude)}` : '';
  try {
    const data = await apiFetch<BoredResponse>(`/v1/users/me/bored${qs}`);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Bored pick failed';
    return NextResponse.json({ error: message }, { status });
  }
}
