import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock('@/lib/api', () => ({ API_BASE_URL: 'https://api.druthers.test' }));
vi.mock('@/lib/session', () => ({ getToken: mocks.getToken }));

describe('Goodreads import route', () => {
  beforeEach(() => {
    mocks.getToken.mockReset();
    vi.unstubAllGlobals();
  });

  it('requires a signed-in user before forwarding an upload', async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await POST(new Request('https://www.druthers.test/api/import/goodreads', { method: 'POST' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Not signed in' });
  });

  it('forwards the CSV and preserves the import summary from the API', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        trackers_created: 2,
        unplaced_read_book_ids: ['book-2'],
        skipped: [],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const formData = new FormData();
    const file = new File(['Title,Author\nBook,Author'], 'goodreads.csv', { type: 'text/csv' });
    formData.append('file', file);

    const response = await POST(new Request('https://www.druthers.test/api/import/goodreads', {
      method: 'POST',
      body: formData,
    }));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.druthers.test/v1/users/me/import/goodreads',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer user-token' },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      trackers_created: 2,
      unplaced_read_book_ids: ['book-2'],
      skipped: [],
    });
  });

  it('rejects a request that does not contain a file', async () => {
    mocks.getToken.mockResolvedValue('user-token');
    const formData = new FormData();

    const response = await POST(new Request('https://www.druthers.test/api/import/goodreads', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'File is required' });
  });
});
