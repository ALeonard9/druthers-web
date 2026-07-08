import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionMovies, filterMovies, type MovieFilters } from '@/lib/movies';
import type { UserMovie } from '@/lib/types';
import { RankingsList } from '@/components/RankingsList';
import { ToRankList } from '@/components/ToRankList';
import { WatchlistCard } from '@/components/WatchlistCard';
import { FilterBar, type FilterValues } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let movies: UserMovie[] = [];
  try {
    movies = await apiFetch<UserMovie[]>('/v1/users/me/movies');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const filters: MovieFilters = {
    q: sp.q,
    genre: sp.genre,
    yearMin: num(sp.yearMin),
    yearMax: num(sp.yearMax),
    ratingMin: num(sp.ratingMin),
  };
  const filterValues: FilterValues = {
    q: sp.q ?? '',
    genre: sp.genre ?? '',
    yearMin: sp.yearMin ?? '',
    yearMax: sp.yearMax ?? '',
    ratingMin: sp.ratingMin ?? '',
  };
  const hasFilter = Object.values(filterValues).some(Boolean);

  const filtered = filterMovies(movies, filters);
  const { watchlist, rankingsPlaced, rankingsUnplaced } =
    partitionMovies(filtered);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Movies</h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on watchlist · {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 &&
              ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <Link
          href="/movies/search"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add a movie
        </Link>
      </div>

      <FilterBar initial={filterValues} />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Watchlist</h2>
          <p className="mb-4 text-xs text-neutral-500">Movies you want to watch.</p>
          {watchlist.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {hasFilter ? (
                'No watchlist movies match the filter.'
              ) : (
                <>
                  Nothing queued —{' '}
                  <Link href="/movies/search" className="text-indigo-400">
                    add one
                  </Link>
                  .
                </>
              )}
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
            Enter a position to jump the list, then place a movie there.
          </p>
          <ToRankList
            items={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
          <RankingsList
            items={rankingsPlaced}
            placedCount={rankingsPlaced.length}
          />
        </section>
      </div>
    </div>
  );
}
