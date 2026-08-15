import { requireShelf } from '@/lib/requireShelf';

export default async function BooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireShelf('books');
  return <>{children}</>;
}
