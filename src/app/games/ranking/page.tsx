import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionGames, filterGames } from '@/lib/games';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { GAME_TABS } from '@/lib/sectionTabs';
import type { UserVideoGame, Summary } from '@/lib/types';
import { GameRankingsBoard } from '@/components/GameRankingsBoard';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function GamesRankingPage({
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
  const { rankingsPlaced, rankingsUnplaced } = partitionGames(
    filterGames(games, filters),
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={GAME_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Games
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
        basePath="/games/ranking"
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
        <p className="mb-4 text-xs text-neutral-500">
          Drag a “to rank” game into the list, or use Go To to jump to a spot.
        </p>
        {rankingsPlaced.length === 0 && rankingsUnplaced.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked games match the filter.'
            ) : (
              <>
                Nothing ranked yet —{' '}
                <Link href="/games/search" className="text-brass">
                  add a game
                </Link>{' '}
                or promote one from your{' '}
                <Link href="/games/backlog" className="text-brass">
                  backlog
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <GameRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        )}
      </section>
    </div>
  );
}
