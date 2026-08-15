import Link from 'next/link';
import type { SummaryShelf } from '@/lib/types';
import type { DeckItem } from '@/lib/deck';
import { RankedPosterDeck } from './RankedPosterDeck';

const HREF: Record<SummaryShelf['category'], string> = {
  movies: '/movies',
  tv: '/tv',
  books: '/books',
  games: '/games',
};

function toDeckItems(shelf: SummaryShelf, base: string): DeckItem[] {
  return shelf.top.map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    title: entry.title,
    subtitle: entry.year ? String(entry.year) : '',
    posterUrl: entry.poster_url,
    href: `${base}/${entry.id}`,
  }));
}

/**
 * One domain's home-page carousel: same header as the old Top5Board
 * (title, ranked count, watchlist link) but a poster deck body instead of a
 * text list, linking through to that domain's My List (`base`).
 */
export function HomeShelfCarousel({ shelf }: { shelf: SummaryShelf }) {
  const base = HREF[shelf.category];
  const items = toDeckItems(shelf, base);

  return (
    <section className="flex flex-col rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <Link
          href={base}
          className="font-display text-lg text-paper hover:text-brass"
        >
          {shelf.label}
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          {shelf.ranked_count} ranked
          {!!shelf.queued_count && ` · ${shelf.queued_count} queued`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="flex-1 px-4 py-6 text-sm text-neutral-500">
          Nothing ranked yet -{' '}
          <Link href={base} className="text-brass hover:text-brass-bright">
            start your list
          </Link>
          .
        </p>
      ) : (
        <div className="px-4 py-4">
          <RankedPosterDeck
            items={items}
            placedCount={shelf.ranked_count}
            label={`Your top ${shelf.label}`}
          />
        </div>
      )}
    </section>
  );
}
