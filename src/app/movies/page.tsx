import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionMovies } from '@/lib/movies';
import type { UserMovie } from '@/lib/types';
import { MovieCard } from '@/components/MovieCard';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let movies: UserMovie[] = [];
  try {
    movies = await apiFetch<UserMovie[]>('/v1/users/me/movies');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { watched, watchlist } = partitionMovies(movies);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Movies</h1>
          <p className="text-sm text-neutral-400">
            {movies.length} tracked · {watched.length} watched ·{' '}
            {watchlist.length} on watchlist
          </p>
        </div>
        <Link
          href="/movies/search"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add a movie
        </Link>
      </div>

      <Section title="Watchlist" empty="Nothing queued — add one." items={watchlist} />
      <Section title="Watched" empty="No watched movies yet." items={watched} />
    </div>
  );
}

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: UserMovie[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-medium text-neutral-200">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <MovieCard key={m.id} userMovie={m} />
          ))}
        </ul>
      )}
    </section>
  );
}
