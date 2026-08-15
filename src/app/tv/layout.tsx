import { requireShelf } from '@/lib/requireShelf';

export default async function TvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireShelf('tv');
  return <>{children}</>;
}
