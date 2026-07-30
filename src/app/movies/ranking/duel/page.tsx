import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { RankingDuelPage } from '@/components/RankingDuelPage';
import { SHELVES, movieToDuelEntry } from '@/lib/duelShelves';
import type { UserMovie } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MoviesDuelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { item } = await searchParams;

  let movies: UserMovie[] = [];
  try {
    movies = await apiFetch<UserMovie[]>('/v1/users/me/movies');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <RankingDuelPage
      shelf={SHELVES.movies}
      entries={movies.filter((m) => m.on_rankings).map(movieToDuelEntry)}
      focusId={item}
    />
  );
}
