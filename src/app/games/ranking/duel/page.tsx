import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { RankingDuelPage } from '@/components/RankingDuelPage';
import { SHELVES, gameToDuelEntry } from '@/lib/duelShelves';
import type { UserVideoGame } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function GamesDuelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { item } = await searchParams;

  let games: UserVideoGame[] = [];
  try {
    games = await apiFetch<UserVideoGame[]>('/v1/users/me/games');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <RankingDuelPage
      shelf={SHELVES.games}
      entries={games.filter((g) => g.on_rankings).map(gameToDuelEntry)}
      focusId={item}
    />
  );
}
