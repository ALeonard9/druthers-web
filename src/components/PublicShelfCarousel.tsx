import Link from 'next/link';
import type { PublicShelf } from '@/lib/types';
import type { DeckItem } from '@/lib/deck';
import { RankedPosterDeck } from './RankedPosterDeck';

function toDeckItems(shelf: PublicShelf, base: string): DeckItem[] {
  return shelf.items.map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    title: entry.title,
    subtitle: entry.year ? String(entry.year) : '',
    posterUrl: entry.poster_url,
    href: `${base}/${entry.id}`,
  }));
}

/**
 * One domain's public profile carousel: matches the HomeShelfCarousel but
 * expects a PublicShelf and routes back to the public viewer rather than
 * the logged-in user's My List.
 */
export function PublicShelfCarousel({
  handle,
  shelf,
}: {
  handle: string;
  shelf: PublicShelf;
}) {
  // `slug` is the domain (e.g. "movies", "tv") in the public profile context
  const base = `/${shelf.slug}`;
  const items = toDeckItems(shelf, base);
  const href = `/u/${handle}/${shelf.slug}`;

  return (
    <section className="flex flex-col rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <Link
          href={href}
          className="font-display text-lg text-paper hover:text-brass"
        >
          {shelf.category}
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          {shelf.ranked_count} ranked
          {!!shelf.watchlist_count && ` · ${shelf.watchlist_count} queued`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="flex-1 px-4 py-6 text-sm text-neutral-500">
          Nothing ranked here yet.
        </p>
      ) : (
        <div className="px-4 py-4">
          <RankedPosterDeck
            items={items}
            placedCount={shelf.ranked_count}
            label={`${shelf.category} rankings`}
          />
        </div>
      )}
    </section>
  );
}
