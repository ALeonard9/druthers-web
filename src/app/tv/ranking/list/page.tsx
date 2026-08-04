import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionShows, filterShows } from '@/lib/tv';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { tvExtras } from '@/lib/tvFilterFields';
import { TV_TABS } from '@/lib/sectionTabs';
import type { UserTVShow, Summary } from '@/lib/types';
import { TVRankingsBoard } from '@/components/TVRankingsBoard';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function TVRankingListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let shows: UserTVShow[] = [];
  let summary: Summary;
  try {
    [shows, summary] = await Promise.all([
      apiFetch<UserTVShow[]>('/v1/users/me/tv-shows'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { rankingsPlaced, rankingsUnplaced } = partitionShows(
    filterShows(shows, filters),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={TV_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My TV Shows
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 && ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button data={buildShareData(summary)} initialCategory="tv" />
          <Link
            href="/tv/ranking"
            className="rounded border border-line px-3 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper"
          >
            Rank by comparison →
          </Link>
          <Link
            href="/tv/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a show
          </Link>
        </div>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/tv/ranking/list"
        searchLabel="Search (title, network)"
        searchPlaceholder="e.g. Severance"
        genreOptions={optionsWithCounts(shows.map((s) => s.tv_show.genre))}
        extras={tvExtras(shows)}
      />

      <section>
        <p className="mb-4 text-xs text-neutral-500">
          Drag a “to rank” show into the list, or use Go To to jump to a spot.
        </p>
        {rankingsPlaced.length === 0 && rankingsUnplaced.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked shows match the filter.'
            ) : (
              <>
                Nothing ranked yet —{' '}
                <Link href="/tv/search" className="text-brass">
                  add a show
                </Link>{' '}
                or promote one from your{' '}
                <Link href="/tv/watchlist" className="text-brass">
                  watchlist
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <TVRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        )}
      </section>
    </div>
  );
}
