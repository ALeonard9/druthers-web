'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicShelfItem } from '@/lib/types';
import type { DeckItem } from '@/lib/deck';
import { useRankedListLength } from '@/lib/rankedListLength';
import { useShelfViewMode } from '@/lib/shelfViewMode';
import { LengthControl } from './LengthControl';
import { ViewModeToggle } from './ViewModeToggle';
import { RankedPosterDeck } from './RankedPosterDeck';

const BATCH = 25;

function toDeckItems(items: PublicShelfItem[], slug: string): DeckItem[] {
  return items.map((item) => ({
    id: `${slug}-${item.rank}`,
    rank: item.rank,
    title: item.title,
    subtitle: item.year ? String(item.year) : '',
    posterUrl: item.poster_url,
    href: '',
  }));
}

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

// Length control + List/Carousel/Icons toggle for a public/friend-visible
// profile shelf (#122). Unlike the owner's own RankingsBoard, this data
// isn't all fetched up front — a shared link paging into a 2,000-item shelf
// shouldn't cost the same as browsing it — so "load more" here means an
// actual network fetch (#279's shelf/limit/offset), not just revealing more
// of an in-memory array.
export function PublicShelfRankedViewer({
  handle,
  slug,
  label,
  initialItems,
  totalCount,
}: {
  handle: string;
  slug: string;
  label: string;
  initialItems: PublicShelfItem[];
  totalCount: number;
}) {
  const [length, setLength] = useRankedListLength();
  const [viewMode, setViewMode] = useShelfViewMode();
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  // Refetch from the top whenever the length control changes (including the
  // redundant fetch on first mount that re-requests the same page the
  // server already rendered — accepted for simplicity on a page anonymous
  // visitors load fresh each time anyway).
  useEffect(() => {
    let cancelled = false;
    const limit = length === 'all' ? BATCH : Number(length);
    fetch(
      `/api/public-profile/${handle}?shelf=${slug}&kind=ranked&limit=${limit}&offset=0`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const shelf = body.shelves?.[0];
        if (shelf) setItems(shelf.items);
      });
    return () => {
      cancelled = true;
    };
  }, [handle, slug, length]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public-profile/${handle}?shelf=${slug}&kind=ranked&limit=${BATCH}&offset=${items.length}`,
      );
      if (!res.ok) return;
      const body = await res.json();
      const shelf = body.shelves?.[0];
      if (shelf) setItems((prev) => [...prev, ...shelf.items]);
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
        <p className="text-sm text-neutral-500">Nothing ranked yet.</p>
      ) : viewMode === 'carousel' ? (
        <RankedPosterDeck
          items={toDeckItems(items, slug)}
          placedCount={totalCount}
          label={label}
        />
      ) : viewMode === 'icons' ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item) => (
            <Link href={`/${slug}/${item.id}`} key={item.rank} className="group flex flex-col gap-1">
              <div className="relative overflow-hidden rounded">
                <Poster url={item.poster_url} className="aspect-[2/3] w-full transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                <span className="absolute left-1 top-1 rounded bg-night/80 px-1.5 py-0.5 font-display text-xs text-brass shadow-sm">
                  {item.rank}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-neutral-300 transition-colors group-hover:text-brass-bright">{item.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <ol className="rounded-lg border border-line bg-panel">
          {items.map((item) => (
            <li
              key={item.rank}
              className="group flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-neutral-800/50"
            >
              <span className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded bg-brass-wash font-display text-sm text-brass transition-colors group-hover:bg-brass group-hover:text-ink">
                {item.rank}
              </span>
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
