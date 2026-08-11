'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { DeckItem } from '@/lib/deck';
import { useShelfViewMode } from '@/lib/shelfViewMode';
import { ViewModeToggle } from './ViewModeToggle';
import { RankedPosterDeck } from './RankedPosterDeck';
import {
  WatchlistActionProvider,
  WatchlistActions,
  useWatchlistRemovedIds,
} from './WatchlistActions';

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

interface WatchlistViewerProps {
  items: DeckItem[];
  label: string;
  iconsContent: ReactNode;
  filterBar: ReactNode;
  emptyMessage: ReactNode;
}

function WatchlistViewerContent({
  items,
  label,
  iconsContent,
  filterBar,
  emptyMessage,
}: WatchlistViewerProps) {
  const [viewMode, setViewMode] = useShelfViewMode();
  const removedIds = useWatchlistRemovedIds();
  const visibleItems = items.filter((item) => !removedIds.has(item.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode !== 'carousel' && filterBar}

      {visibleItems.length === 0 ? (
        emptyMessage
      ) : viewMode === 'carousel' ? (
        <RankedPosterDeck
          items={visibleItems}
          placedCount={visibleItems.length}
          label={label}
          showRank={false}
          renderCaptionActions={(item) =>
            item.watchlistActions ? <WatchlistActions item={item.watchlistActions} /> : null
          }
        />
      ) : viewMode === 'icons' ? (
        iconsContent
      ) : (
        <ol className="rounded-lg border border-line bg-panel">
          {visibleItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0 sm:flex-nowrap"
            >
              <Link href={item.href} className="block h-10 w-7 shrink-0 overflow-hidden rounded">
                <Poster url={item.posterUrl} className="h-full w-full" />
              </Link>
              <Link
                href={item.href}
                className="min-w-0 flex-1 text-neutral-200 hover:underline"
              >
                <span className="block truncate">{item.title}</span>
                {item.sourceHandle && (
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-brass/80">
                    From @{item.sourceHandle}
                  </span>
                )}
              </Link>
              {item.subtitle && (
                <span className="shrink-0 font-mono text-xs text-neutral-500">
                  {item.subtitle}
                </span>
              )}
              {item.watchlistActions && (
                <div className="ml-auto flex basis-full shrink-0 justify-end pt-1 sm:basis-auto sm:pt-0">
                  <WatchlistActions item={item.watchlistActions} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A signed-in user's domain watchlist in Carousel, List, or Icons form. */
export function WatchlistViewer(props: WatchlistViewerProps) {
  return (
    <WatchlistActionProvider>
      <WatchlistViewerContent {...props} />
    </WatchlistActionProvider>
  );
}
