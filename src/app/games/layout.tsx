import { requireShelf } from '@/lib/requireShelf';

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireShelf('games');
  return <>{children}</>;
}
