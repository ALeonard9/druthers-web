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
 * A domain's Watchlist with the same Carousel/List/Icons options as My List.
 * Watchlist rows have no rank, so Carousel and List browse read-only (click
 * through to the detail page to promote/remove); Icons keeps the existing
 * per-domain WatchlistCard grid (`iconsContent`), which already carries
 * those actions, so nothing about that flow regresses.
 */
export function WatchlistViewer({
  items,
  label,
  iconsContent,
  filterBar,
  emptyMessage,
}: {
  items: DeckItem[];
  label: string;
  iconsContent: ReactNode;
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
        <RankedPosterDeck items={items} placedCount={items.length} label={label} showRank={false} />
      ) : viewMode === 'icons' ? (
        iconsContent
      ) : (
        <ol className="rounded-lg border border-line bg-panel">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0"
            >
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
