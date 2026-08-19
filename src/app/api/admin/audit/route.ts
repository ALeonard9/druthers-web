import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminAuditResponse } from '@/lib/types';

const PASSTHROUGH_PARAMS = ['limit', 'offset', 'actor', 'target', 'action'] as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of PASSTHROUGH_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) query.set(key, value);
  }
  if (!query.has('limit')) query.set('limit', '50');
  if (!query.has('offset')) query.set('offset', '0');

  try {
    const data = await apiFetch<AdminAuditResponse>(`/v1/admin/audit?${query}`);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Audit query failed';
    return NextResponse.json({ error: message }, { status });
  }
}
