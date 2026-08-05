import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicProfile } from '@/lib/publicProfile';
import { PublicWatchlistViewer } from '@/components/PublicWatchlistViewer';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import {
  buildPublicShareData,
  buildShareDestination,
  type ShareCategory,
} from '@/lib/shareCards';

import { getWatchlistLabels } from '@/lib/domainLabels';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string; category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, category } = await params;
  const label = getWatchlistLabels(category).singular.toLowerCase();
  return {
    title: `@${handle}’s ${category} ${label} — Druthers`,
    description: `What @${handle} wants to get to next, in ${category}.`,
    openGraph: {
      title: `@${handle}’s ${category} ${label}`,
      description: `What @${handle} wants to get to next, in ${category}.`,
      url: `/u/${handle}/${category}/watchlist`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${handle}’s ${category} ${label}`,
      description: `What @${handle} wants to get to next, in ${category}.`,
    },
  };
}

export default async function PublicWatchlistPage({ params }: Props) {
  const { handle, category } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) notFound();

  const shelf = profile.shelves.find((s) => s.slug === category);
  if (!shelf || !shelf.watchlist || shelf.watchlist.length === 0) notFound();

  const totalCount = shelf.watchlist_count ?? shelf.watchlist.length;
  const watchlistLabel = getWatchlistLabels(shelf.slug).singular.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/u/${profile.handle}/${shelf.slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass hover:text-brass-bright"
        >
          ← {shelf.category}
        </Link>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-paper">
          {shelf.category} {watchlistLabel}
        </h1>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-400">{totalCount} up next</p>
          <ShareTop5Button
            data={buildPublicShareData(profile)}
            initialCategory={shelf.slug as ShareCategory}
            kind="watchlist"
            destination={
              profile.viewer.relationship === 'self'
                ? undefined
                : buildShareDestination({
                    handle: profile.handle,
                    visibility:
                      profile.viewer.relationship === 'friend' ? 'friends' : 'public',
                    category: shelf.slug as ShareCategory,
                    kind: 'watchlist',
                  })
            }
          />
        </div>
      </div>

      <PublicWatchlistViewer
        handle={profile.handle}
        slug={shelf.slug}
        initialItems={shelf.watchlist}
        totalCount={totalCount}
      />
    </div>
  );
}
