import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/session';

// Streams the API's own generated template through the BFF, rather than
// hand-maintaining a static copy that can drift from the columns the upload
// endpoint actually validates against.
export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const upstream = await fetch(
    `${API_BASE_URL}/v1/users/me/import/movies/template.csv`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Could not fetch the import template' },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'text/csv',
  );
  headers.set(
    'Content-Disposition',
    upstream.headers.get('content-disposition') ??
      'attachment; filename="druthers-movies-template.csv"',
  );
  return new NextResponse(upstream.body, { headers });
}
