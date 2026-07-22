import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionBooks, filterBooks, type BookFilters } from '@/lib/books';
import type { UserBook, Summary } from '@/lib/types';
import { BookRankingsBoard } from '@/components/BookRankingsBoard';
import { BookWatchlistCard } from '@/components/BookWatchlistCard';
import { FilterBar, type FilterValues } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

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
      apiFetch<UserBook[]>('/v1/users/me/books'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const filters: BookFilters = {
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

  const filtered = filterBooks(books, filters);
  const { watchlist, rankingsPlaced, rankingsUnplaced } =
    partitionBooks(filtered);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">My Books</h1>
          <p className="text-sm text-neutral-400">
            {watchlist.length} to read · {rankingsPlaced.length} ranked
            {rankingsUnplaced.length > 0 &&
              ` · ${rankingsUnplaced.length} to rank`}
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
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a book
          </Link>
        </div>
      </div>

      <FilterBar
        initial={filterValues}
        basePath="/books"
        searchLabel="Search (title, author)"
        searchPlaceholder="e.g. Herbert"
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">To read</h2>
          <p className="mb-4 text-xs text-neutral-500">Books you want to read.</p>
          {watchlist.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {hasFilter ? (
                'No to-read books match the filter.'
              ) : (
                <>
                  Nothing queued —{' '}
                  <Link href="/books/search" className="text-brass">
                    add one
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {watchlist.map((b) => (
                <BookWatchlistCard key={b.id} userBook={b} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">Rankings</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Drag a “to rank” book into the list, or use Go To to jump to a spot.
          </p>
          <BookRankingsBoard
            placed={rankingsPlaced}
            unplaced={rankingsUnplaced}
            placedCount={rankingsPlaced.length}
          />
        </section>
      </div>
    </div>
  );
}
