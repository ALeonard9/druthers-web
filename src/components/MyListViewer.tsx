'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { DeckItem } from '@/lib/deck';
import { useShelfViewMode } from '@/lib/shelfViewMode';
import { ViewModeToggle } from './ViewModeToggle';
import { RankedPosterDeck } from './RankedPosterDeck';

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

/**
 * A signed-in user's own "My List" for one domain: Carousel (default) /
 * List / Icons, the same three modes the public profile shelf offers
 * (`PublicShelfRankedViewer`). Unlike the public viewer this has the full
 * collection in hand already - no pagination/length control needed.
 *
 * `filterBar` arrives pre-built from the server page (it needs unfiltered
 * genre options computed there) and is only shown outside Carousel mode,
 * matching FilterBar's existing List/Icon-only placement on Ranking/
 * Watchlist pages.
 */
export function MyListViewer({
  items,
  totalCount,
  label,
  filterBar,
  emptyMessage,
}: {
  items: DeckItem[];
  totalCount: number;
  label: string;
  filterBar: ReactNode;
  emptyMessage: ReactNode;
}) {
  const [viewMode, setViewMode] = useShelfViewMode();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode !== 'carousel' && filterBar}

      {items.length === 0 ? (
        emptyMessage
      ) : viewMode === 'carousel' ? (
        <RankedPosterDeck items={items} placedCount={totalCount} label={label} />
      ) : viewMode === 'icons' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="flex flex-col gap-1">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded border border-line">
                <Poster url={item.posterUrl} className="h-full w-full" />
                <span className="absolute left-1 top-1 rounded bg-night/80 px-1.5 py-0.5 font-display text-xs text-brass">
                  {item.rank}
                </span>
              </div>
              <p className="truncate text-xs text-neutral-300">{item.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <ol className="rounded-lg border border-line bg-panel">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0"
            >
              <span className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded bg-brass-wash font-display text-sm text-brass">
                {item.rank}
              </span>
              <Link href={item.href} className="block h-10 w-7 shrink-0 overflow-hidden rounded">
                <Poster url={item.posterUrl} className="h-full w-full" />
              </Link>
              <Link
                href={item.href}
                className="flex-1 truncate text-neutral-200 hover:underline"
              >
                {item.title}
              </Link>
              {item.subtitle && (
                <span className="shrink-0 font-mono text-xs text-neutral-500">
                  {item.subtitle}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
