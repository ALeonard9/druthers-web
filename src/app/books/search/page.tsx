import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { DomainCatalogSearch } from '@/components/DomainCatalogSearch';
import { MultiAddMode } from '@/components/MultiAddMode';
import { DomainIcon } from '@/components/DomainIcon';

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
        <h1 className="inline-flex items-center gap-2 font-display text-3xl font-medium tracking-tight text-paper">
          <DomainIcon domain="books" className="h-5 w-5" />
          Add a book
        </h1>
        <p className="text-sm text-neutral-400">
          Search Open Library to add books one at a time.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Moving from Goodreads?{' '}
          <Link href="/import/goodreads" className="text-brass hover:text-brass-bright">
            Import your library.
          </Link>
        </p>
      </div>
      <MultiAddMode>
        <DomainCatalogSearch domain="books" />
      </MultiAddMode>
    </div>
  );
}
