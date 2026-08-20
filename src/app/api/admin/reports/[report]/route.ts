import { NextResponse } from 'next/server';
import { API_BASE_URL, apiFetch, ApiError } from '@/lib/api';
import { getToken } from '@/lib/session';
import type { AdminReportBucket, AdminReportName, AdminReportResponse } from '@/lib/types';

const REPORTS: AdminReportName[] = [
  'signups',
  'active_users',
  'tracking_volume',
  'top_titles',
  'top_users',
  'engagement_by_tier',
  'activation',
  'retention',
  'conversion',
];
const BUCKETS: AdminReportBucket[] = ['day', 'week', 'month'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const { report } = await params;
  if (!REPORTS.includes(report as AdminReportName)) {
    return NextResponse.json({ error: 'Unknown report' }, { status: 404 });
  }

  const search = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const from = search.get('from')?.trim();
  const to = search.get('to')?.trim();
  const bucket = search.get('bucket')?.trim();
  const format = search.get('format');
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (bucket && BUCKETS.includes(bucket as AdminReportBucket)) query.set('bucket', bucket);
  if (format === 'csv') query.set('format', 'csv');

  try {
    if (format === 'csv') {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/v1/admin/reports/${report}?${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'Report export failed' }, { status: response.status });
      }
      return new Response(await response.text(), {
        headers: {
          'Content-Type': response.headers.get('Content-Type') ?? 'text/csv',
          'Content-Disposition': response.headers.get('Content-Disposition') ?? `attachment; filename="${report}.csv"`,
        },
      });
    }
    const data = await apiFetch<AdminReportResponse>(`/v1/admin/reports/${report}?${query}`);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Report query failed';
    return NextResponse.json({ error: message }, { status });
  }
}
