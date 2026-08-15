import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as addMovie } from './movies/add/route';
import { POST as addTV } from './tv/add/route';
import { POST as addBook } from './books/add/route';
import { POST as addGame } from './games/add/route';
import { ApiError } from '@/lib/api';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('@/lib/api', () => ({
  apiFetch: mocks.apiFetch,
  ApiError: class extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

function request(payload: Record<string, unknown>) {
  return new Request('http://localhost/api/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, list: 'rankings' }),
  });
}

describe('catalog add duplicate recovery after catalog paging', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    {
      name: 'movie',
      handler: addMovie,
      payload: { tmdb: 438631, title: 'Dune', poster_url: null },
      lookup: '/v1/movies?tmdb=438631',
      catalog: { id: 'movie-id', tmdb: 438631, title: 'Dune' },
      tracker: '/v1/users/me/movies/movie-id',
    },
    {
      name: 'book',
      handler: addBook,
      payload: { isbn: '9780441172719', title: 'Dune', poster_url: null },
      lookup: '/v1/books?isbn=9780441172719',
      catalog: { id: 'book-id', isbn: '9780441172719', title: 'Dune' },
      tracker: '/v1/users/me/books/book-id',
    },
    {
      name: 'game',
      handler: addGame,
      payload: { igdb: 1942, title: 'The Witcher 3', poster_url: null },
      lookup: '/v1/games?igdb=1942',
      catalog: { id: 'game-id', igdb: 1942, title: 'The Witcher 3' },
      tracker: '/v1/users/me/games/game-id',
    },
  ])('finds an existing $name directly by external ID', async (testCase) => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'Already exists'))
      .mockResolvedValueOnce([testCase.catalog])
      .mockResolvedValueOnce({ id: 'tracker-id' });

    const response = await testCase.handler(request(testCase.payload));

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(2, testCase.lookup);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(3, testCase.tracker, {
      method: 'POST',
      body: { on_rankings: true },
    });
  });

  it('finds an existing TV show by TVmaze without listing the first page', async () => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'Already exists'))
      .mockResolvedValueOnce([{ id: 'show-id', tvmaze: 49_298, title: 'Severance' }])
      .mockResolvedValueOnce({ id: 'tracker-id' });

    const response = await addTV(request({
      tvmaze: 49_298,
      imdb: 'tt11280740',
      title: 'Severance',
      poster_url: null,
    }));

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(2, '/v1/tv-shows?tvmaze=49298');
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(
      3,
      '/v1/users/me/tv-shows/show-id',
      { method: 'POST', body: { on_rankings: true } },
    );
  });

  it('falls back to IMDb when TVmaze points at a duplicate catalog row', async () => {
    mocks.apiFetch
      .mockRejectedValueOnce(new ApiError(400, 'Already exists'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'show-id', imdb: 'tt11280740', title: 'Severance' }])
      .mockResolvedValueOnce({ id: 'tracker-id' });

    const response = await addTV(request({
      tvmaze: 1,
      imdb: 'tt11280740',
      title: 'Severance',
      poster_url: null,
    }));

    expect(response.status).toBe(201);
    expect(mocks.apiFetch).toHaveBeenNthCalledWith(3, '/v1/tv-shows?imdb=tt11280740');
  });
});
