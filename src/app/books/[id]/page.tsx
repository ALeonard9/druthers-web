import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Book, UserBook } from '@/lib/types';
import { BookDetail } from '@/components/BookDetail';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;

  // The tracker 404s when the book isn't on any list — that's not an error.
  const trackerOrNull = apiFetch<UserBook>(`/v1/users/me/books/${id}`).catch(
    (err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    },
  );

  let book: Book;
  let tracker: UserBook | null;
  try {
    [book, tracker] = await Promise.all([
      apiFetch<Book>(`/v1/books/${id}`),
      trackerOrNull,
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/books" className="text-sm text-indigo-400 hover:text-indigo-300">
        ← Back to My Books
      </Link>
      <BookDetail book={book} tracker={tracker} />
    </div>
  );
}
