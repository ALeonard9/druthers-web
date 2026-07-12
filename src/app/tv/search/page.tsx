import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { TVSearch } from '@/components/TVSearch';

export default async function TVSearchPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a TV show</h1>
        <p className="text-sm text-neutral-400">
          Search TVMaze and add a show to your list.
        </p>
      </div>
      <TVSearch />
    </div>
  );
}
