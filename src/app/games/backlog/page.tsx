import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionGames, filterGames } from '@/lib/games';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import type { UserVideoGame, Summary } from '@/lib/types';
import { GameWatchlistCard } from '@/components/GameWatchlistCard';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function GamesBacklogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let games: UserVideoGame[] = [];
  let summary: Summary;
  try {
    [games, summary] = await Promise.all([
      apiFetch<UserVideoGame[]>('/v1/users/me/games'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { watchlist } = partitionGames(filterGames(games, filters));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs
        tabs={[
          { href: '/games', label: 'Rankings' },
          { href: '/games/backlog', label: 'Backlog' },
        ]}
      />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Games
          </h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on backlog
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="games"
          />
          <Link
            href="/games/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a game
          </Link>
        </div>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/games/backlog"
        searchLabel="Search (title, platform)"
        searchPlaceholder="e.g. Zelda"
        ratingMaxBound={100}
        genreOptions={optionsWithCounts(games.map((g) => g.game.genre))}
        extras={[
          {
            kind: 'select',
            name: 'platform',
            label: 'Platform',
            options: optionsWithCounts(games.map((g) => g.game.platforms)),
          },
          { kind: 'checkbox', name: 'hundred', label: '100% completed' },
        ]}
      />

      <section>
        <p className="mb-4 text-xs text-neutral-500">Games you want to play.</p>
        {watchlist.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {hasFilter ? (
              'No backlog games match the filter.'
            ) : (
              <>
                Nothing queued —{' '}
                <Link href="/games/search" className="text-brass">
                  add one
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {watchlist.map((g) => (
              <GameWatchlistCard key={g.id} userGame={g} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
