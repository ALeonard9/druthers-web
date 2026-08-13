import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionBooks, filterBooks } from '@/lib/books';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { bookWatchlistDeckItems } from '@/lib/deck';
import type { UserBook, Summary } from '@/lib/types';
import { BookWatchlistCard } from '@/components/BookWatchlistCard';
import { WatchlistViewer } from '@/components/WatchlistViewer';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';
import { BOOK_TABS } from '@/lib/sectionTabs';

export const dynamic = 'force-dynamic';

export default async function BooksToReadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const sp = await searchParams;

  let books: UserBook[] = [];
  let summary: Summary;
  try {
    [books, summary] = await Promise.all([
      apiFetch<UserBook[]>('/v1/users/me/books?on_watchlist=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { watchlist } = partitionBooks(filterBooks(books, filters));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={BOOK_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Books
          </h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} on Read List
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="books"
            kind="watchlist"
          />
          <Link
            href="/books/search?from=watchlist"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a book
          </Link>
        </div>
      </div>

      <WatchlistViewer
        items={bookWatchlistDeckItems(watchlist)}
        label="Your Read List"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/books/to-read"
            searchLabel="Search (title, author)"
            searchPlaceholder="e.g. Herbert"
            ratingMaxBound={5}
            genreOptions={optionsWithCounts(books.map((b) => b.book.genre))}
            extras={[
              { kind: 'number', name: 'pagesMax', label: 'Max pages', width: 'w-24' },
            ]}
          />
        }
        iconsContent={
          <ul key="icons" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {watchlist.map((b) => (
              <BookWatchlistCard key={b.id} userBook={b} />
            ))}
          </ul>
        }
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No books on your Read List match the filter.'
            ) : (
              <>
                Nothing queued —{' '}
                <Link href="/books/search?from=watchlist" className="text-brass">
                  add one
                </Link>
                .
              </>
            )}
          </p>
        }
      />
    </div>
  );
}
