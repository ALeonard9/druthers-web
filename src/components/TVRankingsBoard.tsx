'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShowStatusBadge } from './ShowStatusBadge';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UserTVShow } from '@/lib/types';
import { pagerWindow } from '@/lib/pagerWindow';
import { useRankedListLength } from '@/lib/rankedListLength';
import { useIncrementalReveal } from '@/lib/useIncrementalReveal';
import { LengthControl } from './LengthControl';

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

// A show in the "to rank" bucket - drag it (by the grip) into the ranked list,
// or send it back to the watchlist.
function ToRankChip({
  item,
  onMoveToWatchlist,
  onPlaceTop,
}: {
  item: UserTVShow;
  onMoveToWatchlist: (s: UserTVShow) => void;
  onPlaceTop: (s: UserTVShow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.tv_show.id, data: { type: 'torank' } });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-700 bg-panel p-2"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag into the ranked list"
          title="Drag into the ranked list"
          className="cursor-grab px-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
        >
          ⠿
        </button>
        <Poster url={item.tv_show.poster_url} className="h-10 w-7 rounded" />
        <Link
          href={`/tv/${item.tv_show.id}`}
          className="flex-1 truncate text-sm text-neutral-200 hover:text-brass-bright hover:underline"
        >
          {item.tv_show.title}
        </Link>
        <ShowStatusBadge show={item} />
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => onMoveToWatchlist(item)}
          className="min-h-10 rounded border border-line px-3 py-2 text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-line/40"
        >
          Watchlist
        </button>
        <button
          onClick={() => onPlaceTop(item)}
          title="Rank at #1 without dragging"
          className="min-h-10 rounded border border-brass/50 bg-brass-wash px-3 py-2 text-xs font-medium text-brass hover:border-brass hover:bg-brass hover:text-ink"
        >
          Rank #1
        </button>
        <Link
          href={`/tv/ranking?item=${item.tv_show.id}`}
          title="Rank by comparison instead of dragging"
          className="inline-flex min-h-10 items-center rounded bg-brass px-3 py-2 text-xs font-semibold text-ink hover:bg-brass-bright"
        >
          Rank by comparison →
        </Link>
      </div>
    </div>
  );
}

// Always-present drop target for "#1" - the only way to place a show when
// the ranked list is empty (with no ranked rows, there's nothing else to
// drop onto), and a quick way to jump one to the top otherwise.
function DropToTop({ label }: { label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__rank_top__' });
  return (
    <div
      ref={setNodeRef}
      className={`mb-2 rounded-lg border-2 border-dashed p-3 text-center text-xs font-medium transition-colors ${
        isOver
          ? 'border-brass bg-brass-wash/40 text-paper'
          : 'border-neutral-700 text-neutral-500'
      }`}
    >
      {label}
    </div>
  );
}

// A ranked row - sortable (drag to move) and a drop target for to-rank chips.
function RankedRow({
  item,
  onConfirmRemove,
  onRerank,
}: {
  item: UserTVShow;
  onConfirmRemove: (s: UserTVShow) => void;
  onRerank: (s: UserTVShow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.tv_show.id, data: { type: 'ranked', rank: item.rank } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-2"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab px-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded bg-brass-wash px-2 font-display text-base font-medium text-brass">
          {item.rank}
        </span>
        <Poster url={item.tv_show.poster_url} className="h-12 w-8 rounded" />
        <Link
          href={`/tv/${item.tv_show.id}`}
          className="flex-1 truncate text-sm text-neutral-200 hover:text-brass-bright hover:underline"
        >
          {item.tv_show.title}
          {item.tv_show.year ? ` (${item.tv_show.year})` : ''}
        </Link>
        <ShowStatusBadge show={item} />
      </div>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
        <button
          onClick={() => onRerank(item)}
          title="Pull it back out and re-judge its position by comparison"
          className="min-h-10 rounded border border-line px-3 py-2 text-xs font-medium text-neutral-200 hover:border-brass/60 hover:text-brass"
        >
          Rerank
        </button>
        <button
          onClick={() => onConfirmRemove(item)}
          aria-label={`Remove ${item.tv_show.title} from rankings`}
          className="min-h-10 rounded border border-red-600/60 px-3 py-2 text-xs font-medium text-red-300 hover:border-red-500 hover:bg-red-600/20 hover:text-red-200"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export function TVRankingsBoard({
  placed,
  unplaced,
  placedCount,
}: {
  placed: UserTVShow[];
  unplaced: UserTVShow[];
  placedCount: number;
}) {
  const router = useRouter();
  const [length, setLength] = useRankedListLength();
  // `start` is a 1-based position within `placed` (whatever's currently
  // displayed - filtered or not), not the item's real rank - see
  // pagerWindow for why (api#225 / web#80).
  const [start, setStart] = useState(1);
  // Reset the window to the top when the length control changes, rather than
  // keeping whatever position happened to be showing under the old size -
  // adjusted during render (React's pattern for "reset state when a prop
  // changes") instead of an effect, so it takes effect before paint.
  const [lengthAtLastStart, setLengthAtLastStart] = useState(length);
  if (lengthAtLastStart !== length) {
    setLengthAtLastStart(length);
    setStart(1);
  }
  const [goto, setGoto] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // "All" doesn't page by window - it reveals more of the already-fetched
  // list as the viewer scrolls, since mounting 2000 draggable rows at once
  // (not fetching them; `placed` already holds everything) is the actual
  // cost (#122).
  const windowSize = length === 'all' ? placedCount : Number(length);
  const win = pagerWindow(start, windowSize, placedCount);
  const { count: revealCount, sentinelRef } = useIncrementalReveal(placedCount, length);
  const windowItems =
    length === 'all'
      ? placed.slice(0, revealCount)
      : placed.slice(win.start - 1, win.start - 1 + win.length);
  const byId = (id: string) =>
    [...placed, ...unplaced].find((s) => s.tv_show.id === id);

  function submitGoto(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(goto, 10);
    if (Number.isFinite(n) && n >= 1) {
      setStart(n);
    }
  }

  async function placeAt(showId: string, position: number) {
    await fetch(`/api/tv/${showId}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
    router.refresh();
  }

  async function track(s: UserTVShow, body: object) {
    await fetch(`/api/tv/${s.tv_show.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    router.refresh();
  }



  // Clears the position (closing the gap it leaves) without leaving
  // Rankings, so it re-enters the "to rank" queue and completed_at is
  // untouched - only a fresh entry into Rankings stamps that date.
  async function rerank(s: UserTVShow) {
    await fetch(`/api/tv/${s.tv_show.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rank: null }),
    });
    router.push(`/tv/ranking?item=${s.tv_show.id}&wasRank=${s.rank}`);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    if (over.id === '__rank_top__') {
      placeAt(String(active.id), 1);
      return;
    }
    if (active.id === over.id) return;
    const overItem = byId(String(over.id));
    // Dropping onto a ranked row places the dragged show at that row's spot.
    if (overItem && overItem.rank != null) {
      placeAt(String(active.id), overItem.rank);
    }
  }

  const activeItem = activeId ? byId(activeId) : null;

  return (
    <DndContext
      // Explicit id keeps dnd-kit's generated aria ids stable between the server
      // and client render (otherwise hydration mismatches on DndDescribedBy-N).
      id="tv-rankings-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {unplaced.length > 0 && (
        <div className="mb-4 rounded-lg border border-dashed border-neutral-700 bg-panel/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            To rank ({unplaced.length}) - drag into the list below
          </p>
          <div className="flex flex-col gap-2">
            {unplaced.map((s) => (
              <ToRankChip
                key={s.tv_show.id}
                item={s}
                onMoveToWatchlist={(s) => track(s, { on_rankings: false, on_watchlist: true })}
                onPlaceTop={(m) => placeAt(m.tv_show.id, 1)}
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submitGoto} className="mb-3 flex gap-2">
        <input
          type="number"
          min={1}
          max={placedCount}
          value={goto}
          onChange={(e) => setGoto(e.target.value)}
          placeholder={`Go to position (1–${placedCount})`}
          className="flex-1 rounded border border-neutral-700 bg-panel px-3 py-2 text-sm outline-none focus:border-brass"
        />
        <button
          type="submit"
          className="rounded bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600"
        >
          Go To…
        </button>
      </form>

      {unplaced.length > 0 && (
        <DropToTop
          label={
            placed.length === 0
              ? 'Drop here to start your rankings'
              : 'Drop here to make #1'
          }
        />
      )}

      {placed.length === 0 ? (
        <p className="text-sm text-neutral-500">No ranked shows yet.</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-neutral-500">
            {length === 'all' ? (
              <span>
                Showing {windowItems.length} of {placedCount}
              </span>
            ) : (
              <>
                <span>
                  Showing #{win.start}–#{win.end} of {placedCount}
                </span>
                <span className="flex gap-2">
                  <button
                    onClick={() => setStart(win.start - windowSize)}
                    disabled={!win.hasPrev}
                    className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
                  >
                    ↑ up
                  </button>
                  <button
                    onClick={() => setStart(win.start + windowSize)}
                    disabled={!win.hasNext}
                    className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
                  >
                    ↓ down
                  </button>
                </span>
              </>
            )}
            <LengthControl value={length} onChange={setLength} />
          </div>
          <SortableContext
            items={windowItems.map((s) => s.tv_show.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {windowItems.map((s) => (
                <RankedRow
                  key={s.tv_show.id}
                  item={s}
                  onConfirmRemove={(item) => track(item, { on_rankings: false })}
                  onRerank={rerank}
                />
              ))}
            </ul>
          </SortableContext>
          {length === 'all' && windowItems.length < placedCount && (
            <div ref={sentinelRef} className="h-4" />
          )}
        </>
      )}

      <DragOverlay>
        {activeItem ? (
          <div className="flex items-center gap-2 rounded-lg border border-brass bg-line p-2 shadow-lg">
            <Poster url={activeItem.tv_show.poster_url} className="h-10 w-7 rounded" />
            <span className="text-sm">{activeItem.tv_show.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
