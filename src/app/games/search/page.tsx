import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { GameSearch } from '@/components/GameSearch';
import { MultiAddMode } from '@/components/MultiAddMode';

export default async function GameSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { from } = await searchParams;

  const backHref = from === 'watchlist' ? '/games/backlog' : '/games';
  const backLabel = from === 'watchlist' ? '← Back to Backlog' : '← Back to My Games';

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="text-sm text-brass hover:text-brass-bright">
        {backLabel}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Add a game</h1>
        <p className="text-sm text-neutral-400">
          Search IGDB and add a game to your backlog or rankings.
        </p>
      </div>
      <MultiAddMode>
        <GameSearch />
      </MultiAddMode>
    </div>
  );
}
