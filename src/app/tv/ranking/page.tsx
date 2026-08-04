import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { RankingDuelPage } from '@/components/RankingDuelPage';
import { SHELVES, showToDuelEntry } from '@/lib/duelShelves';
import type { UserTVShow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TVDuelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { item, wasRank } = await searchParams;

  let shows: UserTVShow[] = [];
  try {
    shows = await apiFetch<UserTVShow[]>('/v1/users/me/tv-shows');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <RankingDuelPage
      shelf={SHELVES.tv}
      entries={shows.filter((s) => s.on_rankings).map(showToDuelEntry)}
      focusId={item}
      priorRank={wasRank ? Number(wasRank) : undefined}
    />
  );
}
