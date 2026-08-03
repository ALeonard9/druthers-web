'use client';

import { useEffect, useState } from 'react';
import type { PublicWatchlistItem } from '@/lib/types';
import { useRankedListLength } from '@/lib/rankedListLength';
import { LengthControl } from './LengthControl';

const BATCH = 25;

// Same length control as the ranked-list viewer, without the List/Carousel/
// Icons toggle — a watchlist has no rank to anchor a carousel or icon grid
// against, so it keeps its existing plain list.
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
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

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
      <div className="flex justify-end">
        <LengthControl value={length} onChange={setLength} />
      </div>

      <ol className="rounded-lg border border-line bg-panel">
        {items.map((item, i) => (
          <li
            key={`${slug}-watchlist-${i}`}
            className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0"
          >
            <span className="flex-1 truncate text-neutral-200">{item.title}</span>
            {item.year && (
              <span className="shrink-0 font-mono text-xs text-neutral-500">
                {item.year}
              </span>
            )}
          </li>
        ))}
      </ol>

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
