import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicProfile } from '@/lib/publicProfile';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — Druthers`,
    description: `@${handle}’s druthers: their favorites, ranked.`,
  };
}

// Hub page (#93): links out to each opted-in shelf's own page rather than
// cramming every carousel + watchlist onto one screen — a shelf's Top 25
// deck and its watchlist are each a full-width page of their own.
export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
          @{profile.handle}’s all-timers
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-paper">
          {profile.display_name ?? `@${profile.handle}`}
        </h1>
        <p className="text-sm text-neutral-400">
          {profile.total_ranked} ranked · shared shelves only
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {profile.shelves.map((shelf) => (
          <li
            key={shelf.slug}
            className="rounded-lg border border-line bg-panel px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/u/${profile.handle}/${shelf.slug}`}
                className="font-display text-lg text-paper hover:text-brass"
              >
                {shelf.category}
              </Link>
              <span className="font-mono text-xs text-neutral-500">
                {shelf.ranked_count} ranked
              </span>
            </div>
            <div className="mt-1 flex gap-4 text-sm">
              <Link
                href={`/u/${profile.handle}/${shelf.slug}`}
                className="text-brass hover:text-brass-bright"
              >
                Top 25 →
              </Link>
              {shelf.watchlist && shelf.watchlist.length > 0 && (
                <Link
                  href={`/u/${profile.handle}/${shelf.slug}/watchlist`}
                  className="text-brass hover:text-brass-bright"
                >
                  Watchlist →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-600">
        www.druthers.io — your favorites, ranked
      </p>
    </div>
  );
}
