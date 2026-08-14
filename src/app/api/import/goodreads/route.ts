import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/session';

function upstreamError(body: string, status: number) {
  try {
    const data: unknown = JSON.parse(body);
    if (typeof data === 'object' && data !== null) {
      const message = 'error' in data ? data.error : 'detail' in data ? data.detail : null;
      if (typeof message === 'string' && message) return message;
    }
  } catch {
    // A gateway may return a non-JSON error page; keep the message useful.
  }

  return `Goodreads import failed (status ${status}). Please try again.`;
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/v1/users/me/import/goodreads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    return NextResponse.json({ error: 'Goodreads import is temporarily unavailable. Please try again.' }, { status: 502 });
  }

  const body = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json({ error: upstreamError(body, upstream.status) }, { status: upstream.status });
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid response from upstream' }, { status: 502 });
  }

  return NextResponse.json(json, { status: upstream.status });
}
