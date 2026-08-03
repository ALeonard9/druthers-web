import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { RankingDuelPage } from '@/components/RankingDuelPage';
import { SHELVES, bookToDuelEntry } from '@/lib/duelShelves';
import type { UserBook } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BooksDuelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { item, wasRank } = await searchParams;

  let books: UserBook[] = [];
  try {
    books = await apiFetch<UserBook[]>('/v1/users/me/books');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <RankingDuelPage
      shelf={SHELVES.books}
      entries={books.filter((b) => b.on_rankings).map(bookToDuelEntry)}
      focusId={item}
      priorRank={wasRank ? Number(wasRank) : undefined}
    />
  );
}
