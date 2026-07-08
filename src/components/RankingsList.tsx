'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UserMovie } from '@/lib/types';

function trackApi(movieId: string, body: Record<string, unknown>) {
  return fetch(`/api/movies/${movieId}/track`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function Row({ item, position }: { item: UserMovie; position: number }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.movie.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function remove() {
    await trackApi(item.movie.id, { on_rankings: false });
    router.refresh();
  }

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
      <span className="w-8 text-right font-mono text-sm text-neutral-400">
        {position}
      </span>
      {item.movie.poster_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.movie.poster_url}
          alt=""
          className="h-14 w-10 rounded object-cover"
        />
      ) : (
        <div className="h-14 w-10 rounded bg-neutral-800" />
      )}
      <span className="flex-1 truncate text-sm">{item.movie.title}</span>
      <button
        onClick={remove}
        className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
      >
        Remove
      </button>
    </li>
  );
}

export function RankingsList({ items }: { items: UserMovie[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(items);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // The parent remounts this component (via a key on the membership signature)
  // when the set of ranked movies changes, so local order starts fresh.

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((m) => m.movie.id === active.id);
    const newIndex = order.findIndex((m) => m.movie.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    await fetch('/api/movies/rankings/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_ids: next.map((m) => m.movie.id) }),
    });
    router.refresh();
  }

  if (order.length === 0) {
    return <p className="text-sm text-neutral-500">No ranked movies yet.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((m) => m.movie.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          {order.map((item, i) => (
            <Row key={item.movie.id} item={item} position={i + 1} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
