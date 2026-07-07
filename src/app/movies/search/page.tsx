import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { MovieSearch } from '@/components/MovieSearch';

export default async function MovieSearchPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a movie</h1>
        <p className="text-sm text-neutral-400">
          Search the catalog and add a title to your list.
        </p>
      </div>
      <MovieSearch />
    </div>
  );
}
