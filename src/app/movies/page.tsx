import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionMovies } from '@/lib/movies';
import type { UserMovie } from '@/lib/types';
import { RankingsList } from '@/components/RankingsList';
import { WatchlistCard } from '@/components/WatchlistCard';

export const dynamic = 'force-dynamic';

// The drag list stays responsive by capping how many ranked rows render.
const RANKINGS_LIMIT = 100;

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

  const { watchlist, rankings } = partitionMovies(movies);
  const shownRankings = rankings.slice(0, RANKINGS_LIMIT);
  // Remount RankingsList when the ranked set changes so its local drag state resets.
  const rankingsKey = shownRankings
    .map((m) => m.movie.id)
    .sort()
    .join(',');

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Movies</h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on watchlist · {rankings.length} ranked
          </p>
        </div>
        <Link
          href="/movies/search"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add a movie
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Watchlist</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Movies you want to watch.
          </p>
          {watchlist.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nothing queued —{' '}
              <Link href="/movies/search" className="text-indigo-400">
                add one
              </Link>
              .
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {watchlist.map((m) => (
                <WatchlistCard key={m.id} userMovie={m} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Rankings</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Drag to reorder your favorites.
            {rankings.length > RANKINGS_LIMIT &&
              ` Showing top ${RANKINGS_LIMIT} of ${rankings.length}.`}
          </p>
          <RankingsList key={rankingsKey} items={shownRankings} />
        </section>
      </div>
    </div>
  );
}
