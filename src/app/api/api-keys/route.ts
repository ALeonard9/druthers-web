import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { ApiKey, ApiKeyCreated } from '@/lib/types';

// List the caller's API keys (never includes secrets).
export async function GET() {
  try {
    const keys = await apiFetch<ApiKey[]>('/v1/users/me/api-keys');
    return NextResponse.json(keys);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status });
  }
}

// Mint a key — the response carries the plaintext exactly once.
export async function POST(request: Request) {
  const body = await request.json();
  try {
    const key = await apiFetch<ApiKeyCreated>('/v1/users/me/api-keys', {
      method: 'POST',
      body: { name: body.name },
    });
    return NextResponse.json(key, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Create failed';
    return NextResponse.json({ error: message }, { status });
  }
}
