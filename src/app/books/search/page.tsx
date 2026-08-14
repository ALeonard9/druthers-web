import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { BookSearch } from '@/components/BookSearch';
import { MultiAddMode } from '@/components/MultiAddMode';

export default async function BookSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { from } = await searchParams;

  const backHref = from === 'watchlist' ? '/books/to-read' : '/books';
  const backLabel = from === 'watchlist' ? '← Back to To-Read' : '← Back to My Books';

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="text-sm text-brass hover:text-brass-bright">
        {backLabel}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Add a book</h1>
        <p className="text-sm text-neutral-400">
          Search Open Library, or bring in your existing Goodreads library.
        </p>
      </div>
      <Link
        href="/import/goodreads"
        className="group flex items-center justify-between gap-4 rounded-xl border border-brass/40 bg-brass/5 px-5 py-4 transition-colors hover:border-brass hover:bg-brass/10"
      >
        <span>
          <span className="block font-display text-xl text-paper">Import from Goodreads</span>
          <span className="mt-1 block text-sm text-neutral-400">
            Add your saved reading history from a Goodreads CSV export.
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-brass group-hover:text-brass-bright">Import →</span>
      </Link>
      <MultiAddMode>
        <BookSearch />
      </MultiAddMode>
    </div>
  );
}
