import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionMovies, filterMovies } from '@/lib/movies';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { movieWatchlistDeckItems } from '@/lib/deck';
import type { UserMovie, Summary } from '@/lib/types';
import { WatchlistCard } from '@/components/WatchlistCard';
import { WatchlistViewer } from '@/components/WatchlistViewer';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';
import { MOVIE_TABS } from '@/lib/sectionTabs';

export const dynamic = 'force-dynamic';

export default async function MoviesWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let movies: UserMovie[] = [];
  let summary: Summary;
  try {
    [movies, summary] = await Promise.all([
      apiFetch<UserMovie[]>('/v1/users/me/movies?on_watchlist=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { watchlist } = partitionMovies(filterMovies(movies, filters));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={MOVIE_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Movies
          </h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on watchlist
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="movies"
            kind="watchlist"
          />
          <Link
            href="/movies/search?from=watchlist"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a movie
          </Link>
        </div>
      </div>

      <WatchlistViewer
        items={movieWatchlistDeckItems(watchlist)}
        label="Your watchlist"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/movies/watchlist"
            genreOptions={optionsWithCounts(movies.map((m) => m.movie.genre))}
            extras={[
              {
                kind: 'select',
                name: 'rated',
                label: 'Rated',
                options: optionsWithCounts(movies.map((m) => m.movie.rated)),
              },
              {
                kind: 'number',
                name: 'runtimeMax',
                label: 'Max runtime (min)',
                width: 'w-28',
              },
            ]}
          />
        }
        iconsContent={
          <ul key="icons" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {watchlist.map((m) => (
              <WatchlistCard key={m.id} userMovie={m} />
            ))}
          </ul>
        }
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No watchlist movies match the filter.'
            ) : (
              <>
                Nothing queued —{' '}
                <Link href="/movies/search?from=watchlist" className="text-brass">
                  add one
                </Link>
                .
              </>
            )}
          </p>
        }
      />
    </div>
  );
}
