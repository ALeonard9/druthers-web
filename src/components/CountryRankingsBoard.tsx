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
import type { UserCountry } from '@/lib/types';

const WINDOW = 25;

function Flag({ emoji }: { emoji: string | null }) {
  return (
    <span className="w-8 text-center text-2xl leading-none">{emoji ?? '🏳️'}</span>
  );
}

// A country in the "to rank" bucket — drag it (by the grip) into the ranked
// list, or send it back to the bucket list.
function ToRankChip({
  item,
  onMoveToBucket,
}: {
  item: UserCountry;
  onMoveToBucket: (c: UserCountry) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.country.id, data: { type: 'torank' } });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-2"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag into the ranked list"
        title="Drag into the ranked list"
        className="cursor-grab px-1 text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
      >
        ⠿
      </button>
      <Flag emoji={item.country.flag_emoji} />
      <Link
        href={`/countries/${item.country.id}`}
        className="flex-1 truncate text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
      >
        {item.country.title}
      </Link>
      <button
        onClick={() => onMoveToBucket(item)}
        title="Move back to the bucket list"
        className="rounded px-2 py-1 text-xs text-neutral-400 hover:text-white"
      >
        → Bucket list
      </button>
    </div>
  );
}

// A ranked row — sortable (drag to move) and a drop target for to-rank chips.
function RankedRow({
  item,
  confirming,
  onAskRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  item: UserCountry;
  confirming: boolean;
  onAskRemove: (c: UserCountry) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (c: UserCountry) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.country.id,
      data: { type: 'ranked', rank: item.rank },
    });
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
      <Flag emoji={item.country.flag_emoji} />
      <Link
        href={`/countries/${item.country.id}`}
        className="flex-1 truncate text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
      >
        {item.country.title}
      </Link>
      {item.first_visited && (
        <span className="hidden text-xs text-neutral-600 sm:inline">
          first: {item.first_visited.slice(0, 10)}
        </span>
      )}
      {confirming ? (
        <span className="flex shrink-0 items-center gap-2 rounded bg-red-950/70 px-2 py-1 text-xs text-red-200 ring-1 ring-red-800">
          <span className="hidden sm:inline">
            Remove #{item.rank}? Countries below move up.
          </span>
          <button
            onClick={onCancelRemove}
            className="rounded px-2 py-0.5 text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmRemove(item)}
            className="rounded bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-500"
          >
            Remove
          </button>
        </span>
      ) : (
        <button
          onClick={() => onAskRemove(item)}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
        >
          Remove
        </button>
      )}
    </li>
  );
}

export function CountryRankingsBoard({
  placed,
  unplaced,
  placedCount,
}: {
  placed: UserCountry[];
  unplaced: UserCountry[];
  placedCount: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState(1);
  const [goto, setGoto] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const windowItems = placed.filter((c) => (c.rank ?? 0) >= start).slice(0, WINDOW);
  const byId = (id: string) =>
    [...placed, ...unplaced].find((c) => c.country.id === id);

  function submitGoto(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(goto, 10);
    if (Number.isFinite(n) && n >= 1) {
      setStart(Math.max(1, Math.min(n, Math.max(1, placedCount))));
    }
  }

  async function placeAt(countryId: string, position: number) {
    await fetch(`/api/countries/${countryId}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
    router.refresh();
  }

  // Removal is confirmed inline in the row (see RankedRow), not via window.confirm.
  async function remove(c: UserCountry) {
    setConfirmingId(null);
    await fetch(`/api/countries/${c.country.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_rankings: false }),
    });
    router.refresh();
  }

  async function moveToBucket(c: UserCountry) {
    await fetch(`/api/countries/${c.country.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_rankings: false, on_watchlist: true }),
    });
    router.refresh();
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const overItem = byId(String(over.id));
    // Dropping onto a ranked row places the dragged country at that row's spot.
    if (overItem && overItem.rank != null) {
      placeAt(String(active.id), overItem.rank);
    }
  }

  const activeItem = activeId ? byId(activeId) : null;

  return (
    <DndContext
      // Explicit id keeps dnd-kit's generated aria ids stable between the server
      // and client render (otherwise hydration mismatches on DndDescribedBy-N).
      id="country-rankings-board"
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
            {unplaced.map((c) => (
              <ToRankChip
                key={c.country.id}
                item={c}
                onMoveToBucket={moveToBucket}
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
        <p className="text-sm text-neutral-500">No ranked countries yet.</p>
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
            items={windowItems.map((c) => c.country.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {windowItems.map((c) => (
                <RankedRow
                  key={c.country.id}
                  item={c}
                  confirming={confirmingId === c.country.id}
                  onAskRemove={(x) => setConfirmingId(x.country.id)}
                  onCancelRemove={() => setConfirmingId(null)}
                  onConfirmRemove={remove}
                />
              ))}
            </ul>
          </SortableContext>
        </>
      )}

      <DragOverlay>
        {activeItem ? (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500 bg-neutral-800 p-2 shadow-lg">
            <Flag emoji={activeItem.country.flag_emoji} />
            <span className="text-sm">{activeItem.country.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
