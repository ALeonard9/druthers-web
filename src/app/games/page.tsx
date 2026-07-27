import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionGames } from '@/lib/games';
import { DECK_SIZE, gameDeckItems } from '@/lib/deck';
import { GAME_TABS } from '@/lib/sectionTabs';
import type { UserVideoGame, Summary } from '@/lib/types';
import { RankedPosterDeck } from '@/components/RankedPosterDeck';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

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

  // Deliberately unfiltered: this view is the top of the shelf as it stands.
  // Filtering belongs with the list on /games/ranking.
  const { rankingsPlaced } = partitionGames(games);
  const top = gameDeckItems(rankingsPlaced.slice(0, DECK_SIZE));

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

      {top.length > 0 ? (
        <RankedPosterDeck
          items={top}
          placedCount={rankingsPlaced.length}
          label="Your highest ranked games"
        />
      ) : (
        <p className="text-sm text-neutral-500">
          Nothing ranked yet —{' '}
          <Link href="/games/search" className="text-brass">
            add a game
          </Link>{' '}
          or promote one from your{' '}
          <Link href="/games/backlog" className="text-brass">
            backlog
          </Link>
          .
        </p>
      )}
    </div>
  );
}
