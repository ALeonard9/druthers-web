import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock('@/lib/api', () => ({ API_BASE_URL: 'https://api.druthers.test' }));
vi.mock('@/lib/session', () => ({ getToken: mocks.getToken }));

describe('Movies import route', () => {
  beforeEach(() => {
    mocks.getToken.mockReset();
    vi.unstubAllGlobals();
  });

  it('requires a signed-in user before forwarding an upload', async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', { method: 'POST' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Not signed in' });
  });

  it('forwards the CSV and preserves the import summary from the API', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        trackers_created: 2,
        unplaced_watched_movie_ids: ['movie-2'],
        skipped: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const formData = new FormData();
    const file = new File(['title,year\nMatrix,1999'], 'movies.csv', { type: 'text/csv' });
    formData.append('file', file);

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', {
      method: 'POST',
      body: formData,
    }));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.druthers.test/v1/users/me/import/movies',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer user-token' },
      }),
    );
    const upstreamFormData = fetchMock.mock.calls[0][1].body as FormData;
    expect((upstreamFormData.get('file') as File).name).toBe('movies.csv');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      trackers_created: 2,
      unplaced_watched_movie_ids: ['movie-2'],
      skipped: [],
    });
  });

  it('rejects a request that does not contain a file', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const formData = new FormData();

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'File is required' });
  });

  it('returns a useful upstream error for a rejected multipart upload', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'CSV exceeds the 5 MB limit' }, { status: 413 })));
    const formData = new FormData();
    formData.append('file', new File(['csv'], 'movies.csv', { type: 'text/csv' }));

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: 'CSV exceeds the 5 MB limit' });
  });

  it('groups the API\'s flat per-row errors into row_errors on a 422 response', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const apiResponse = {
      valid: false,
      errors: [
        { row: 2, column: 'year', message: 'Invalid year' },
        { row: 2, column: 'title', message: 'Title is required' },
        { row: 5, column: 'tmdb_id', message: 'Duplicate TMDB id' },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(apiResponse, { status: 422 })));
    const formData = new FormData();
    formData.append('file', new File(['csv'], 'movies.csv', { type: 'text/csv' }));

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ...apiResponse,
      row_errors: [
        { row: 2, errors: ['Invalid year', 'Title is required'] },
        { row: 5, errors: ['Duplicate TMDB id'] },
      ],
    });
  });

  it('returns a useful message when the upstream import service is unavailable', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const formData = new FormData();
    formData.append('file', new File(['csv'], 'movies.csv', { type: 'text/csv' }));

    const response = await POST(new Request('https://www.druthers.test/api/import/movies', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Movies import is temporarily unavailable. Please try again.' });
  });
});
