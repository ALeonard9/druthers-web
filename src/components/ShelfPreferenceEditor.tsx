'use client';

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
import type { ShelfPreferences } from '@/lib/shelfPreferences';

function ShelfRow({
  id,
  enabled,
  disableToggle,
  onToggle,
}: {
  id: ShelfId;
  enabled: boolean;
  disableToggle: boolean;
  onToggle: () => void;
}) {
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
          disabled={disableToggle}
          onChange={onToggle}
          aria-label={`Turn ${SHELVES[id].label} ${enabled ? 'off' : 'on'}`}
          className="accent-brass"
        />
        {enabled ? 'On' : 'Off'}
      </label>
    </li>
  );
}

export function ShelfPreferenceEditor({
  preferences,
  onChange,
}: {
  preferences: ShelfPreferences;
  onChange: (preferences: ShelfPreferences, changedShelf?: ShelfId) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function reorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = preferences.order.indexOf(active.id as ShelfId);
    const newIndex = preferences.order.indexOf(over.id as ShelfId);
    onChange({ ...preferences, order: arrayMove(preferences.order, oldIndex, newIndex) });
  }

  function toggle(id: ShelfId) {
    const enabled = preferences.enabled.includes(id)
      ? preferences.enabled.filter((shelf) => shelf !== id)
      : [...preferences.enabled, id];
    onChange({ ...preferences, enabled }, id);
  }

  return (
    <DndContext id="shelf-preference-editor" sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}>
      <SortableContext items={preferences.order} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2" aria-label="Shelf order">
          {preferences.order.map((id) => {
            const enabled = preferences.enabled.includes(id);
            return (
              <ShelfRow
                key={id}
                id={id}
                enabled={enabled}
                disableToggle={enabled && preferences.enabled.length === 1}
                onToggle={() => toggle(id)}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
