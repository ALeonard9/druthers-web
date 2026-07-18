import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionShows, filterShows, type TVFilters } from '@/lib/tv';
import type { UserTVShow } from '@/lib/types';
import { TVRankingsBoard } from '@/components/TVRankingsBoard';
import { TVWatchlistCard } from '@/components/TVWatchlistCard';
import { FilterBar, type FilterValues } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function TVPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let shows: UserTVShow[] = [];
  try {
    shows = await apiFetch<UserTVShow[]>('/v1/users/me/tv-shows');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const filters: TVFilters = {
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

  const filtered = filterShows(shows, filters);
  const { watchlist, rankingsPlaced, rankingsUnplaced } =
    partitionShows(filtered);

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs
        tabs={[
          { href: '/tv', label: 'Shows' },
          { href: '/tv/schedule', label: 'Schedule' },
        ]}
      />
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">My TV Shows</h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on watchlist · {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 &&
              ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData({ email: user.email, shows })}
            initialCategory="tv"
          />
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
        basePath="/tv"
        searchLabel="Search (title, network)"
        searchPlaceholder="e.g. Severance"
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Watchlist</h2>
          <p className="mb-4 text-xs text-neutral-500">Shows you want to watch.</p>
          {watchlist.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {hasFilter ? (
                'No watchlist shows match the filter.'
              ) : (
                <>
                  Nothing queued —{' '}
                  <Link href="/tv/search" className="text-brass">
                    add one
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {watchlist.map((s) => (
                <TVWatchlistCard key={s.id} userShow={s} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Rankings</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Drag a “to rank” show into the list, or use Go To to jump to a spot.
          </p>
          <TVRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        </section>
      </div>
    </div>
  );
}
