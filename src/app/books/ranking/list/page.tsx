import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionBooks, filterBooks } from '@/lib/books';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { BOOK_TABS } from '@/lib/sectionTabs';
import type { UserBook, Summary } from '@/lib/types';
import { BookRankingsBoard } from '@/components/BookRankingsBoard';
import { FilterBar } from '@/components/FilterBar';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function BooksRankingListPage({
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
      apiFetch<UserBook[]>('/v1/users/me/books?on_rankings=true'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { filters, filterValues, hasFilter } = parseFilterParams(sp);
  const { rankingsPlaced, rankingsUnplaced } = partitionBooks(
    filterBooks(books, filters),
  );

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
            {rankingsUnplaced.length > 0 && ` · ${rankingsUnplaced.length} to rank`}
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="books"
          />
          <Link
            href="/books/ranking"
            className="rounded border border-line px-3 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper"
          >
            Rank by comparison →
          </Link>
          <Link
            href="/books/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a book
          </Link>
        </div>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/books/ranking/list"
        searchLabel="Search (title, author)"
        searchPlaceholder="e.g. Herbert"
        ratingMaxBound={5}
        genreOptions={optionsWithCounts(books.map((b) => b.book.genre))}
        extras={[
          { kind: 'number', name: 'pagesMax', label: 'Max pages', width: 'w-24' },
        ]}
      />

      <section>
        <p className="mb-4 text-xs text-neutral-500">
          Drag a “to rank” book into the list, or use Go To to jump to a spot.
        </p>
        {rankingsPlaced.length === 0 && rankingsUnplaced.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked books match the filter.'
            ) : (
              <>
                Nothing ranked yet —{' '}
                <Link href="/books/search" className="text-brass">
                  add a book
                </Link>{' '}
                or promote one from your{' '}
                <Link href="/books/to-read" className="text-brass">
                  Read List
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <BookRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        )}
      </section>
    </div>
  );
}
