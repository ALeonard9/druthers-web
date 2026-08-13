import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionShows, filterShows } from '@/lib/tv';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { tvExtras } from '@/lib/tvFilterFields';
import { tvWatchlistDeckItems } from '@/lib/deck';
import type { UserTVShow, Summary } from '@/lib/types';
import { TVWatchlistCard } from '@/components/TVWatchlistCard';
import { WatchlistViewer } from '@/components/WatchlistViewer';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';
import { TV_TABS } from '@/lib/sectionTabs';

export const dynamic = 'force-dynamic';

export default async function TVWatchlistPage({
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
      apiFetch<UserTVShow[]>('/v1/users/me/tv-shows?on_watchlist=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { watchlist } = partitionShows(filterShows(shows, filters));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={TV_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My TV Shows
          </h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on watchlist
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="tv"
            kind="watchlist"
          />
          <Link
            href="/tv/search?from=watchlist"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a show
          </Link>
        </div>
      </div>

      <WatchlistViewer
        items={tvWatchlistDeckItems(watchlist)}
        label="Your watchlist"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/tv/watchlist"
            searchLabel="Search (title, network)"
            searchPlaceholder="e.g. Severance"
            genreOptions={optionsWithCounts(shows.map((s) => s.tv_show.genre))}
            extras={tvExtras(shows)}
          />
        }
        iconsContent={
          <ul key="icons" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {watchlist.map((s) => (
              <TVWatchlistCard key={s.id} userShow={s} />
            ))}
          </ul>
        }
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No watchlist shows match the filter.'
            ) : (
              <>
                Nothing queued —{' '}
                <Link href="/tv/search?from=watchlist" className="text-brass">
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
