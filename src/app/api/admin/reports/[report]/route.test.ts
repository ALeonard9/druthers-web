import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), getToken: vi.fn() }));

vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://api.test',
  apiFetch: mocks.apiFetch,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) { super(message); this.status = status; }
  },
}));
vi.mock('@/lib/session', () => ({ getToken: mocks.getToken }));

function request(query = '') {
  return new Request(`http://localhost/api/admin/reports/signups${query}`);
}

describe('GET /api/admin/reports/[report]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('proxies only the report contract range parameters', async () => {
    mocks.apiFetch.mockResolvedValue({ report: 'signups', series: [], totals: {} });

    const response = await GET(request('?from=2026-06-01&to=2026-08-20&bucket=week&ignored=yes'), {
      params: Promise.resolve({ report: 'signups' }),
    });

    expect(response.status).toBe(200);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/admin/reports/signups?from=2026-06-01&to=2026-08-20&bucket=week');
  });

  it('refuses an unknown report rather than proxying an arbitrary admin path', async () => {
    const response = await GET(request(), { params: Promise.resolve({ report: 'not-a-report' }) });

    expect(response.status).toBe(404);
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('streams the API CSV instead of serializing the browser data again', async () => {
    mocks.getToken.mockResolvedValue('admin-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('period,count\n2026-08-10,12\n', {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="signups.csv"' },
    })));

    const response = await GET(request('?from=2026-08-01&format=csv'), {
      params: Promise.resolve({ report: 'signups' }),
    });

    expect(fetch).toHaveBeenCalledWith('http://api.test/v1/admin/reports/signups?from=2026-08-01&format=csv', {
      headers: { Authorization: 'Bearer admin-token' }, cache: 'no-store',
    });
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="signups.csv"');
    expect(await response.text()).toContain('2026-08-10,12');
  });
});
