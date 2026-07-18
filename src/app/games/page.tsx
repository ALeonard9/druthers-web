import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionGames, filterGames, type GameFilters } from '@/lib/games';
import type { UserVideoGame } from '@/lib/types';
import { GameRankingsBoard } from '@/components/GameRankingsBoard';
import { GameWatchlistCard } from '@/components/GameWatchlistCard';
import { FilterBar, type FilterValues } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let games: UserVideoGame[] = [];
  try {
    games = await apiFetch<UserVideoGame[]>('/v1/users/me/games');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const filters: GameFilters = {
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

  const filtered = filterGames(games, filters);
  const { watchlist, rankingsPlaced, rankingsUnplaced } =
    partitionGames(filtered);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">My Games</h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on backlog · {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 &&
              ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <Link
          href="/games/search"
          className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          + Add a game
        </Link>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/games"
        searchLabel="Search (title, platform)"
        searchPlaceholder="e.g. Zelda"
        ratingMaxBound={100}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Backlog</h2>
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
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {watchlist.map((g) => (
                <GameWatchlistCard key={g.id} userGame={g} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Rankings</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Drag a “to rank” game into the list, or use Go To to jump to a spot.
          </p>
          <GameRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        </section>
      </div>
    </div>
  );
}
