import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { DomainCatalogSearch } from '@/components/DomainCatalogSearch';
import { MultiAddMode } from '@/components/MultiAddMode';

export default async function TVSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { from } = await searchParams;

  const backHref = from === 'watchlist' ? '/tv/watchlist' : '/tv';
  const backLabel = from === 'watchlist' ? '← Back to Watchlist' : '← Back to My TV Shows';

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="text-sm text-brass hover:text-brass-bright">
        {backLabel}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Add a TV show</h1>
        <p className="text-sm text-neutral-400">
          Search TVMaze and add a show to your list.
        </p>
      </div>
      <MultiAddMode>
        <DomainCatalogSearch domain="tv" />
      </MultiAddMode>
    </div>
  );
}
