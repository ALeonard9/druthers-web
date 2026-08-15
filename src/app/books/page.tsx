import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionBooks, filterBooks } from '@/lib/books';
import { parseFilterParams, optionsWithCounts } from '@/lib/filterParams';
import { bookDeckItems } from '@/lib/deck';
import { BOOK_TABS } from '@/lib/sectionTabs';
import type { UserBook, Summary } from '@/lib/types';
import { MyListViewer } from '@/components/MyListViewer';
import { FilterBar } from '@/components/FilterBar';
import { ProgressBanner } from '@/components/ProgressBanner';
import { progressMessage } from '@/lib/progress';
import { SectionTabs } from '@/components/SectionTabs';
import { DomainIcon } from '@/components/DomainIcon';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BooksPage({
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
  const { rankingsPlaced } = partitionBooks(books);
  const { rankingsPlaced: filteredPlaced } = partitionBooks(
    filterBooks(books, filters),
  );
  const banner = progressMessage(rankingsPlaced.length, 'book');

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={BOOK_TABS} icon={<DomainIcon domain="books" />} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Books
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
            {hasFilter && ' (filtered)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="books"
          />
          <Link
            href="/books/search"
            className="inline-flex items-center gap-1.5 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            <DomainIcon domain="books" className="h-4 w-4" />
            Add a book
          </Link>
        </div>
      </div>

      {banner && <ProgressBanner message={banner} />}

      <MyListViewer
        items={bookDeckItems(filteredPlaced)}
        totalCount={rankingsPlaced.length}
        label="Your ranked books"
        filterBar={
          <FilterBar
            key="filter"
            initial={filterValues}
            basePath="/books"
            searchLabel="Search (title, author)"
            searchPlaceholder="e.g. Herbert"
            ratingMaxBound={5}
            genreOptions={optionsWithCounts(books.map((b) => b.book.genre))}
            extras={[
              { kind: 'number', name: 'pagesMax', label: 'Max pages', width: 'w-24' },
            ]}
          />
        }
        emptyMessage={
          <p key="empty" className="text-sm text-neutral-500">
            {hasFilter ? (
              'No ranked books match the filter.'
            ) : (
              <>
                Nothing ranked yet —{' '}
                <Link href="/books/search" className="inline-flex items-center gap-1 text-brass">
                  <DomainIcon domain="books" className="h-4 w-4" />
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
        }
      />
    </div>
  );
}
