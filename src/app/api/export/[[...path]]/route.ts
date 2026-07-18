import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/session';

interface Ctx {
  params: Promise<{ path?: string[] }>;
}

// Streams the API's export endpoints through the BFF as downloads:
//   /api/export            → JSON (whole account)
//   /api/export/movies.csv → per-domain CSV (movies, tv-shows, tv-episodes,
//                            books, games)
export async function GET(_request: Request, { params }: Ctx) {
  const { path } = await params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const suffix = path?.length ? `/${path.join('/')}` : '';
  const upstream = await fetch(`${API_BASE_URL}/v1/users/me/export${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: upstream.status },
    );
  }
  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'application/json',
  );
  headers.set(
    'Content-Disposition',
    upstream.headers.get('content-disposition') ??
      'attachment; filename="druthers-export.json"',
  );
  return new NextResponse(upstream.body, { headers });
}
