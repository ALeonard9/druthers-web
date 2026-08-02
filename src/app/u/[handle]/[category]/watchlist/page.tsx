import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicProfile } from '@/lib/publicProfile';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, category } = await params;
  return {
    title: `@${handle}’s ${category} watchlist — Druthers`,
    description: `What @${handle} wants to get to next, in ${category}.`,
  };
}

export default async function PublicWatchlistPage({ params }: Props) {
  const { handle, category } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) notFound();

  const shelf = profile.shelves.find((s) => s.slug === category);
  if (!shelf || !shelf.watchlist || shelf.watchlist.length === 0) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <Link
          href={`/u/${profile.handle}/${shelf.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass hover:text-brass-bright"
        >
          ← {shelf.category}
        </Link>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-paper">
          {shelf.category} watchlist
        </h1>
        <p className="text-sm text-neutral-400">
          {shelf.watchlist.length} up next
        </p>
      </div>

      <ol className="rounded-lg border border-line bg-panel">
        {shelf.watchlist.map((item, i) => (
          <li
            key={`${shelf.slug}-watchlist-${i}`}
            className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0"
          >
            <span className="flex-1 truncate text-neutral-200">
              {item.title}
            </span>
            {item.year && (
              <span className="shrink-0 font-mono text-xs text-neutral-500">
                {item.year}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
