import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { GameSearch } from '@/components/GameSearch';

export default async function GameSearchPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Add a game</h1>
        <p className="text-sm text-neutral-400">
          Search IGDB and add a game to your backlog or rankings.
        </p>
      </div>
      <GameSearch />
    </div>
  );
}
