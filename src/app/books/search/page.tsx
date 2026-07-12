import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { BookSearch } from '@/components/BookSearch';

export default async function BookSearchPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Add a book</h1>
        <p className="text-sm text-neutral-400">
          Search Open Library and add a book to your list.
        </p>
      </div>
      <BookSearch />
    </div>
  );
}
