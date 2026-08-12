'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SHELVES, type ShelfId } from '@/lib/duelShelves';
import { saveShelfPreferences, type ShelfPreferences } from '@/lib/shelfPreferences';
import { useShelfPreferences } from '@/lib/useShelfPreferences';

function ShelfRow({ id, enabled, onToggle }: { id: ShelfId; enabled: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-lg border border-line bg-night px-3 py-2"
    >
      <button
        type="button"
        aria-label={`Drag ${SHELVES[id].label}`}
        className="cursor-grab text-lg text-neutral-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className="flex-1 text-sm text-neutral-200">{SHELVES[id].label}</span>
      <label className="flex items-center gap-2 text-xs text-neutral-400">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          aria-label={`Turn ${SHELVES[id].label} ${enabled ? 'off' : 'on'}`}
          className="accent-brass"
        />
        {enabled ? 'On' : 'Off'}
      </label>
    </li>
  );
}

export function ShelfManager() {
  const router = useRouter();
  const preferences = useShelfPreferences();
  const [order, setOrder] = useState<ShelfId[] | null>(null);
  const current = order ?? preferences.order;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: ShelfPreferences) {
    setOrder(next.order);
    saveShelfPreferences(next);
  }

  function reorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = current.indexOf(active.id as ShelfId);
    const newIndex = current.indexOf(over.id as ShelfId);
    persist({ ...preferences, order: arrayMove(current, oldIndex, newIndex) });
  }

  function toggle(id: ShelfId) {
    const isEnabled = preferences.enabled.includes(id);
    const enabled = isEnabled
      ? preferences.enabled.filter((shelf) => shelf !== id)
      : [...preferences.enabled, id];
    persist({ ...preferences, order: current, enabled });
    if (!isEnabled) router.push(`/onboarding?shelf=${id}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
      <p className="text-sm text-neutral-400">Drag shelves into the order you want. Turning one back on starts its five-title setup.</p>
      <DndContext id="shelf-manager" sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
        <SortableContext items={current} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2" aria-label="Shelf order">
            {current.map((id) => (
              <ShelfRow key={id} id={id} enabled={preferences.enabled.includes(id)} onToggle={() => toggle(id)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
