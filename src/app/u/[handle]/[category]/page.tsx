import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicProfile } from '@/lib/publicProfile';
import { PublicShelfRankedViewer } from '@/components/PublicShelfRankedViewer';

import { getWatchlistLabels } from '@/lib/domainLabels';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, category } = await params;
  return {
    title: `@${handle}’s ${category} — Druthers`,
    description: `@${handle}’s top-ranked ${category} on Druthers.`,
  };
}

export default async function PublicShelfPage({ params }: Props) {
  const { handle, category } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) notFound();

  const shelf = profile.shelves.find((s) => s.slug === category);
  if (!shelf) notFound();

  const watchlistLabel = getWatchlistLabels(shelf.slug).singular;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/u/${profile.handle}`}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass hover:text-brass-bright"
        >
          ← @{profile.handle}’s all-timers
        </Link>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-paper">
          {shelf.category}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">{shelf.ranked_count} ranked</p>
          {shelf.watchlist && shelf.watchlist.length > 0 && (
            <Link
              href={`/u/${profile.handle}/${shelf.slug}/watchlist`}
              className="text-sm text-brass hover:text-brass-bright"
            >
              {watchlistLabel} →
            </Link>
          )}
        </div>
      </div>

      <PublicShelfRankedViewer
        handle={profile.handle}
        slug={shelf.slug}
        label={`@${profile.handle}’s ${shelf.category}`}
        initialItems={shelf.items}
        totalCount={shelf.ranked_count}
      />
    </div>
  );
}
