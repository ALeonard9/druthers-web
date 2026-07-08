'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
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
import type { UserMovie } from '@/lib/types';

const WINDOW = 25;

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-neutral-800`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={`${className} object-cover`} />;
}

// A movie in the "to rank" bucket — draggable into the ranked list.
function ToRankChip({ item }: { item: UserMovie }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.movie.id, data: { type: 'torank' } });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-2 active:cursor-grabbing"
      title="Drag into the ranked list"
    >
      <span className="text-neutral-500">⠿</span>
      <Poster url={item.movie.poster_url} className="h-10 w-7 rounded" />
      <span className="truncate text-sm">{item.movie.title}</span>
    </div>
  );
}

// A ranked row — sortable (drag to move) and a drop target for to-rank chips.
function RankedRow({
  item,
  onRemove,
}: {
  item: UserMovie;
  onRemove: (m: UserMovie) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.movie.id, data: { type: 'ranked', rank: item.rank } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-2"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab px-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-neutral-700 px-2 text-sm font-semibold text-white">
        {item.rank}
      </span>
      <Poster url={item.movie.poster_url} className="h-12 w-8 rounded" />
      <Link
        href={`/movies/${item.movie.id}`}
        className="flex-1 truncate text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
      >
        {item.movie.title}
        {item.movie.year ? ` (${item.movie.year})` : ''}
      </Link>
      <button
        onClick={() => onRemove(item)}
        className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
      >
        Remove
      </button>
    </li>
  );
}

export function RankingsBoard({
  placed,
  unplaced,
  placedCount,
}: {
  placed: UserMovie[];
  unplaced: UserMovie[];
  placedCount: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState(1);
  const [goto, setGoto] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const windowItems = placed.filter((m) => (m.rank ?? 0) >= start).slice(0, WINDOW);
  const byId = (id: string) =>
    [...placed, ...unplaced].find((m) => m.movie.id === id);

  function submitGoto(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(goto, 10);
    if (Number.isFinite(n) && n >= 1) {
      setStart(Math.max(1, Math.min(n, Math.max(1, placedCount))));
    }
  }

  async function placeAt(movieId: string, position: number) {
    await fetch(`/api/movies/${movieId}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
    router.refresh();
  }

  async function remove(m: UserMovie) {
    if (
      !window.confirm(
        `Remove "${m.movie.title}" from your ranked list? The movies below it move up.`,
      )
    )
      return;
    await fetch(`/api/movies/${m.movie.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_rankings: false }),
    });
    router.refresh();
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const overItem = byId(String(over.id));
    // Dropping onto a ranked row places the dragged movie at that row's spot.
    if (overItem && overItem.rank != null) {
      placeAt(String(active.id), overItem.rank);
    }
  }

  const activeItem = activeId ? byId(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {unplaced.length > 0 && (
        <div className="mb-4 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            To rank ({unplaced.length}) — drag into the list below
          </p>
          <div className="flex flex-col gap-2">
            {unplaced.map((m) => (
              <ToRankChip key={m.movie.id} item={m} />
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
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600"
        >
          Go To…
        </button>
      </form>

      {placed.length === 0 ? (
        <p className="text-sm text-neutral-500">No ranked movies yet.</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing #{windowItems[0]?.rank ?? start}–#
              {windowItems[windowItems.length - 1]?.rank ?? start} of {placedCount}
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => setStart((s) => Math.max(1, s - WINDOW))}
                disabled={start <= 1}
                className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
              >
                ↑ up
              </button>
              <button
                onClick={() =>
                  setStart((s) => Math.min(placedCount, s + WINDOW))
                }
                disabled={(windowItems[windowItems.length - 1]?.rank ?? 0) >= placedCount}
                className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
              >
                ↓ down
              </button>
            </span>
          </div>
          <SortableContext
            items={windowItems.map((m) => m.movie.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {windowItems.map((m) => (
                <RankedRow key={m.movie.id} item={m} onRemove={remove} />
              ))}
            </ul>
          </SortableContext>
        </>
      )}

      <DragOverlay>
        {activeItem ? (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500 bg-neutral-800 p-2 shadow-lg">
            <Poster url={activeItem.movie.poster_url} className="h-10 w-7 rounded" />
            <span className="text-sm">{activeItem.movie.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
