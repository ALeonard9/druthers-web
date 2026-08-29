import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock('@/lib/api', () => ({ API_BASE_URL: 'https://api.druthers.test' }));
vi.mock('@/lib/session', () => ({ getToken: mocks.getToken }));

describe('Movies import template route', () => {
  beforeEach(() => {
    mocks.getToken.mockReset();
    vi.unstubAllGlobals();
  });

  it('requires a signed-in user before fetching the template', async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Not signed in' });
  });

  it('streams the API-generated CSV through with its content-disposition', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const csv = 'title,release_year,tmdb_id,watched_date\nThe Matrix,1999,603,2026-08-15\n';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(csv, {
        status: 200,
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="druthers-movies-template.csv"',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.druthers.test/v1/users/me/import/movies/template.csv',
      { headers: { Authorization: 'Bearer user-token' }, cache: 'no-store' },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="druthers-movies-template.csv"',
    );
    expect(await response.text()).toBe(csv);
  });

  it('surfaces the upstream status when the template fetch fails', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Could not fetch the import template' });
  });
});
