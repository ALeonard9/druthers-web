import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/session';

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

  const upstream = await fetch(`${API_BASE_URL}/v1/users/me/import/goodreads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = await upstream.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid response from upstream' }, { status: 502 });
  }

  return NextResponse.json(json, { status: upstream.status });
}
