import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Movie, UserMovie } from '@/lib/types';

// Add a movie to one of the user's lists. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the requested list.
export async function POST(request: Request) {
  const { imdb, title, poster_url, list } = await request.json();
  if (!imdb || !title) {
    return NextResponse.json(
      { error: 'imdb and title are required' },
      { status: 400 },
    );
  }
  const target = list === 'rankings' ? 'on_rankings' : 'on_watchlist';

  try {
    let movie: Movie;
    try {
      movie = await apiFetch<Movie>('/v1/movies', {
        method: 'POST',
        body: { imdb, title, poster_url: poster_url ?? null },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const all = await apiFetch<Movie[]>('/v1/movies');
        const found = all.find((m) => m.imdb === imdb);
        if (!found) throw err;
        movie = found;
      } else {
        throw err;
      }
    }

    const tracker = await apiFetch<UserMovie>(
      `/v1/users/me/movies/${movie.id}`,
      { method: 'POST', body: { [target]: true } },
    );
    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Failed to add movie';
    return NextResponse.json({ error: message }, { status });
  }
}
