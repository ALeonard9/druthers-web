import { requireShelf } from '@/lib/requireShelf';

export default async function MoviesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireShelf('movies');
  return <>{children}</>;
}
