import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionBooks } from '@/lib/books';
import { DECK_SIZE, bookDeckItems } from '@/lib/deck';
import { BOOK_TABS } from '@/lib/sectionTabs';
import type { UserBook, Summary } from '@/lib/types';
import { RankedPosterDeck } from '@/components/RankedPosterDeck';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let books: UserBook[] = [];
  let summary: Summary;
  try {
    [books, summary] = await Promise.all([
      apiFetch<UserBook[]>('/v1/users/me/books'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  // Deliberately unfiltered: this view is the top of the shelf as it stands.
  // Filtering belongs with the list on /books/ranking.
  const { rankingsPlaced } = partitionBooks(books);
  const top = bookDeckItems(rankingsPlaced.slice(0, DECK_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={BOOK_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Books
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="books"
          />
          <Link
            href="/books/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a book
          </Link>
        </div>
      </div>

      {top.length > 0 ? (
        <RankedPosterDeck
          items={top}
          placedCount={rankingsPlaced.length}
          label="Your highest ranked books"
        />
      ) : (
        <p className="text-sm text-neutral-500">
          Nothing ranked yet —{' '}
          <Link href="/books/search" className="text-brass">
            add a book
          </Link>{' '}
          or promote one from your{' '}
          <Link href="/books/to-read" className="text-brass">
            to-read list
          </Link>
          .
        </p>
      )}
    </div>
  );
}
