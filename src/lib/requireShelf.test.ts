import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireShelf } from './requireShelf';
import type { Preferences } from './types';

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  apiFetch: vi.fn(),
  redirect: vi.fn(() => {
    // Next.js redirect throws an error to stop execution
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('./session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('./api', () => ({ apiFetch: mocks.apiFetch, ApiError: class extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } } }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

describe('requireShelf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not redirect if there is no logged-in user', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await requireShelf('movies');

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('redirects to settings if the shelf is not enabled', async () => {
    mocks.getSessionUser.mockResolvedValue({ handle: 'test' });
    const prefs: Preferences = {
      shelf_order: ['tv', 'games', 'books', 'movies'],
      enabled_shelves: ['tv', 'games', 'books'],
      time_zone: 'UTC',
      ranked_list_length: '25',
    };
    mocks.apiFetch.mockResolvedValue(prefs);

    await expect(requireShelf('movies')).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith('/settings#shelves');
  });

  it('does not redirect if the shelf is enabled', async () => {
    mocks.getSessionUser.mockResolvedValue({ handle: 'test' });
    const prefs: Preferences = {
      shelf_order: ['tv', 'games', 'books', 'movies'],
      enabled_shelves: ['tv', 'games', 'books', 'movies'],
      time_zone: 'UTC',
      ranked_list_length: '25',
    };
    mocks.apiFetch.mockResolvedValue(prefs);

    await requireShelf('movies');

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('swallows a 401 error from the API as unauthenticated', async () => {
    mocks.getSessionUser.mockResolvedValue({ handle: 'test' });
    const { ApiError } = await import('./api');
    mocks.apiFetch.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    await requireShelf('movies');

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('rethrows other API errors', async () => {
    mocks.getSessionUser.mockResolvedValue({ handle: 'test' });
    const { ApiError } = await import('./api');
    mocks.apiFetch.mockRejectedValue(new ApiError(500, 'Server Error'));

    await expect(requireShelf('movies')).rejects.toThrow('Server Error');
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
