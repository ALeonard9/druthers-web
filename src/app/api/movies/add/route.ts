import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Movie, UserMovie } from '@/lib/types';

// Add a movie to the current user's list. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the user as a watchlist item.
export async function POST(request: Request) {
  const { imdb, title, poster_url } = await request.json();
  if (!imdb || !title) {
    return NextResponse.json(
      { error: 'imdb and title are required' },
      { status: 400 },
    );
  }

  try {
    let movie: Movie;
    try {
      movie = await apiFetch<Movie>('/v1/movies', {
        method: 'POST',
        body: { imdb, title, poster_url: poster_url ?? null },
      });
    } catch (err) {
      // Already in the catalog: look it up by imdb from the full list.
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
      { method: 'POST', body: { completed: 0 } },
    );
    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Failed to add movie';
    return NextResponse.json({ error: message }, { status });
  }
}
