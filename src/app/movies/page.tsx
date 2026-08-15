import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionMovies, filterMovies } from '@/lib/movies';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { movieDeckItems } from '@/lib/deck';
import { MOVIE_TABS } from '@/lib/sectionTabs';
import type { UserMovie, Summary } from '@/lib/types';
import { MyListViewer } from '@/components/MyListViewer';
import { FilterBar } from '@/components/FilterBar';
import { ProgressBanner } from '@/components/ProgressBanner';
import { progressMessage } from '@/lib/progress';
import { SectionTabs } from '@/components/SectionTabs';
import { DomainIcon } from '@/components/DomainIcon';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MoviesPage({
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
      apiFetch<UserMovie[]>('/v1/users/me/movies?on_rankings=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { rankingsPlaced } = partitionMovies(movies);
  const { rankingsPlaced: filteredPlaced } = partitionMovies(
    filterMovies(movies, filters),
  );
  const banner = progressMessage(rankingsPlaced.length, 'movie');

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={MOVIE_TABS} icon={<DomainIcon domain="movies" />} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Movies
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
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
            className="inline-flex items-center gap-1.5 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            <DomainIcon domain="movies" className="h-4 w-4" />
            Add a movie
          </Link>
        </div>
      </div>

      {banner && <ProgressBanner message={banner} />}

      <MyListViewer
        items={movieDeckItems(filteredPlaced)}
        totalCount={rankingsPlaced.length}
        label="Your ranked movies"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/movies"
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
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked movies match the filter.'
            ) : (
              <>
                Nothing ranked yet -{' '}
                <Link href="/movies/search" className="inline-flex items-center gap-1 text-brass">
                  <DomainIcon domain="movies" className="h-4 w-4" />
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
        }
      />
    </div>
  );
}
