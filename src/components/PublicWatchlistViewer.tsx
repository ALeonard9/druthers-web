'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicWatchlistItem } from '@/lib/types';
import type { DeckItem } from '@/lib/deck';
import { useRankedListLength } from '@/lib/rankedListLength';
import { useShelfViewMode } from '@/lib/shelfViewMode';
import { LengthControl } from './LengthControl';
import { ViewModeToggle } from './ViewModeToggle';
import { RankedPosterDeck } from './RankedPosterDeck';
import { getWatchlistLabels } from '@/lib/domainLabels';

const BATCH = 25;

function toDeckItems(items: PublicWatchlistItem[], slug: string): DeckItem[] {
  return items.map((item, idx) => ({
    id: `${slug}-wl-${item.id}`,
    rank: idx + 1,
    title: item.title,
    subtitle: item.year ? String(item.year) : '',
    posterUrl: item.poster_url,
    href: `/${slug}/${item.id}`,
  }));
}

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

export function PublicWatchlistViewer({
  handle,
  slug,
  initialItems,
  totalCount,
}: {
  handle: string;
  slug: string;
  initialItems: PublicWatchlistItem[];
  totalCount: number;
}) {
  const [length, setLength] = useRankedListLength();
  const [viewMode, setViewMode] = useShelfViewMode();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const labels = getWatchlistLabels(slug);

  useEffect(() => {
    let cancelled = false;
    const limit = length === 'all' ? BATCH : Number(length);
    fetch(
      `/api/public-profile/${handle}?shelf=${slug}&kind=watchlist&limit=${limit}&offset=0`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const shelf = body.shelves?.[0];
        if (shelf?.watchlist) setItems(shelf.watchlist);
      });
    return () => {
      cancelled = true;
    };
  }, [handle, slug, length]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public-profile/${handle}?shelf=${slug}&kind=watchlist&limit=${BATCH}&offset=${items.length}`,
      );
      if (!res.ok) return;
      const body = await res.json();
      const shelf = body.shelves?.[0];
      if (shelf?.watchlist) setItems((prev) => [...prev, ...shelf.watchlist]);
    } finally {
      setLoading(false);
    }
  }

  const canLoadMore = length === 'all' && items.length < totalCount;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
        <LengthControl value={length} onChange={setLength} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing on this {labels.singular.toLowerCase()} yet.</p>
      ) : viewMode === 'carousel' ? (
        <RankedPosterDeck
          items={toDeckItems(items, slug)}
          placedCount={totalCount}
          label={`@${handle}’s ${labels.singular}`}
          showRank={false}
          interactive={true}
        />
      ) : viewMode === 'icons' ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item) => (
            <Link href={`/${slug}/${item.id}`} key={item.id} className="group flex flex-col gap-1">
              <div className="relative overflow-hidden rounded">
                <Poster url={item.poster_url} className="aspect-[2/3] w-full transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
              </div>
              <p className="truncate text-xs font-medium text-neutral-300 transition-colors group-hover:text-brass-bright">{item.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <ol className="rounded-lg border border-line bg-panel">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-neutral-800/50"
            >
              <Link href={`/${slug}/${item.id}`} className="block h-10 w-7 shrink-0 overflow-hidden rounded">
                <Poster url={item.poster_url} className="h-full w-full transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href={`/${slug}/${item.id}`} className="flex-1 truncate text-neutral-200 transition-colors group-hover:text-brass-bright group-hover:underline">
                {item.title}
              </Link>
              {item.year && (
                <span className="shrink-0 font-mono text-xs text-neutral-500">
                  {item.year}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {canLoadMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="self-center rounded border border-line px-4 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
        >
          {loading ? 'Loading…' : `Load more (${items.length} of ${totalCount})`}
        </button>
      )}
    </div>
  );
}
