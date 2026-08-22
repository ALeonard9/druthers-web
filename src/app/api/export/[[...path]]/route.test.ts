import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

// The export route streams a user's entire account out of the BFF as a
// download, which makes the auth check the whole story: it must refuse before
// it ever calls the api, and it must attach the caller's own token rather than
// relying on the api to work out who is asking.

const mocks = vi.hoisted(() => ({ getToken: vi.fn(), fetch: vi.fn() }));

vi.mock('@/lib/session', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getToken: mocks.getToken,
}));

const ctx = (path?: string[]) => ({ params: Promise.resolve({ path }) });
const req = () => new Request('http://localhost/api/export');

const upstreamOk = (headers: Record<string, string> = {}) =>
  new Response('col-a,col-b\n', { status: 200, headers });

describe('GET /api/export', () => {
  beforeEach(() => {
    mocks.getToken.mockReset().mockResolvedValue('token-value');
    mocks.fetch.mockReset().mockResolvedValue(upstreamOk());
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('refuses a signed-out caller without calling the api', async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await GET(req(), ctx());

    expect(response.status).toBe(401);
    expect(
      mocks.fetch,
      'a signed-out export attempt still reached the api',
    ).not.toHaveBeenCalled();
  });

  it('sends the caller own bearer token upstream', async () => {
    await GET(req(), ctx());

    const [, init] = mocks.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer token-value');
  });

  it('exports the whole account when no path segment is given', async () => {
    await GET(req(), ctx());

    expect(String(mocks.fetch.mock.calls[0][0])).toContain('/v1/users/me/export');
  });

  it('appends the requested per-domain path', async () => {
    await GET(req(), ctx(['movies.csv']));

    expect(String(mocks.fetch.mock.calls[0][0])).toContain(
      '/v1/users/me/export/movies.csv',
    );
  });

  it('passes the upstream status through when the export fails', async () => {
    mocks.fetch.mockResolvedValue(new Response('nope', { status: 403 }));

    const response = await GET(req(), ctx());

    expect(response.status).toBe(403);
  });

  it('preserves the upstream content type and filename', async () => {
    mocks.fetch.mockResolvedValue(
      upstreamOk({
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="movies.csv"',
      }),
    );

    const response = await GET(req(), ctx(['movies.csv']));

    expect(response.headers.get('content-type')).toBe('text/csv');
    expect(response.headers.get('content-disposition')).toContain('movies.csv');
  });

  it('falls back to a JSON download when the api names neither', async () => {
    // A body-less Response, deliberately: `new Response('some text')` sets
    // content-type to text/plain on its own, so the route's fallback would
    // never be reached and the test would silently prove nothing.
    mocks.fetch.mockResolvedValue(new Response(null, { status: 200 }));

    const response = await GET(req(), ctx());

    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('content-disposition')).toContain(
      'druthers-export.json',
    );
  });
});
