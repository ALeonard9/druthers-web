import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Movie, UserMovie } from '@/lib/types';

// Add a movie to one of the user's lists. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the requested list.
export async function POST(request: Request) {
  const { tmdb, title, poster_url, list } = await request.json();
  if (!tmdb || !title) {
    return NextResponse.json(
      { error: 'tmdb and title are required' },
      { status: 400 },
    );
  }
  const target = list === 'rankings' ? 'on_rankings' : 'on_watchlist';

  try {
    let movie: Movie;
    try {
      movie = await apiFetch<Movie>('/v1/movies', {
        method: 'POST',
        body: { tmdb, title, poster_url: poster_url ?? null },
      });
    } catch (err) {
      // 400 means the catalog already has it - find the existing row so the
      // add still lands on the user's list. Keyed on tmdb since #163.
      if (err instanceof ApiError && err.status === 400) {
        const matches = await apiFetch<Movie[]>(
          `/v1/movies?tmdb=${encodeURIComponent(String(tmdb))}`,
        );
        const found = matches[0];
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
