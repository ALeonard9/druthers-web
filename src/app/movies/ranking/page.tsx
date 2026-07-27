import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionMovies, filterMovies } from '@/lib/movies';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { MOVIE_TABS } from '@/lib/sectionTabs';
import type { UserMovie, Summary } from '@/lib/types';
import { RankingsBoard } from '@/components/RankingsBoard';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MoviesRankingPage({
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
      apiFetch<UserMovie[]>('/v1/users/me/movies'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { rankingsPlaced, rankingsUnplaced } = partitionMovies(
    filterMovies(movies, filters),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={MOVIE_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Movies
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 && ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="movies"
          />
          <Link
            href="/movies/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a movie
          </Link>
        </div>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/movies/ranking"
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

      <section>
        <p className="mb-4 text-xs text-neutral-500">
          Drag a “to rank” movie into the list, or use Go To to jump to a spot.
        </p>
        {rankingsPlaced.length === 0 && rankingsUnplaced.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked movies match the filter.'
            ) : (
              <>
                Nothing ranked yet —{' '}
                <Link href="/movies/search" className="text-brass">
                  add a movie
                </Link>{' '}
                or promote one from your{' '}
                <Link href="/movies/watchlist" className="text-brass">
                  watchlist
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <RankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        )}
      </section>
    </div>
  );
}
