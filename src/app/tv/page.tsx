import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionShows, filterShows } from '@/lib/tv';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { tvExtras } from '@/lib/tvFilterFields';
import { tvDeckItems } from '@/lib/deck';
import { TV_TABS } from '@/lib/sectionTabs';
import type { UserTVShow, Summary } from '@/lib/types';
import { MyListViewer } from '@/components/MyListViewer';
import { FilterBar } from '@/components/FilterBar';
import { ProgressBanner } from '@/components/ProgressBanner';
import { progressMessage } from '@/lib/progress';
import { SectionTabs } from '@/components/SectionTabs';
import { DomainIcon } from '@/components/DomainIcon';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TVPage({
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
      apiFetch<UserTVShow[]>('/v1/users/me/tv-shows?on_rankings=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { rankingsPlaced } = partitionShows(shows);
  const { rankingsPlaced: filteredPlaced } = partitionShows(
    filterShows(shows, filters),
  );
  const banner = progressMessage(rankingsPlaced.length, 'show');

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={TV_TABS} icon={<DomainIcon domain="tv" />} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My TV Shows
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button data={buildShareData(summary)} initialCategory="tv" />
          <Link
            href="/tv/search"
            className="inline-flex items-center gap-1.5 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            <DomainIcon domain="tv" className="h-4 w-4" />
            Add a show
          </Link>
        </div>
      </div>

      {banner && <ProgressBanner message={banner} />}

      <MyListViewer
        items={tvDeckItems(filteredPlaced)}
        totalCount={rankingsPlaced.length}
        label="Your ranked shows"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/tv"
            searchLabel="Search (title, network)"
            searchPlaceholder="e.g. Severance"
            genreOptions={optionsWithCounts(shows.map((s) => s.tv_show.genre))}
            extras={tvExtras(shows)}
          />
        }
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked shows match the filter.'
            ) : (
              <>
                Nothing ranked yet -{' '}
                <Link href="/tv/search" className="inline-flex items-center gap-1 text-brass">
                  <DomainIcon domain="tv" className="h-4 w-4" />
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
        }
      />
    </div>
  );
}
