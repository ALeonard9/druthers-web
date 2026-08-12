'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ShelfId } from '@/lib/duelShelves';
import { saveShelfPreferences, type ShelfPreferences } from '@/lib/shelfPreferences';
import { useShelfPreferences } from '@/lib/useShelfPreferences';
import { ShelfPreferenceEditor } from '@/components/ShelfPreferenceEditor';

export function ShelfManager() {
  const router = useRouter();
  const preferences = useShelfPreferences();
  const [order, setOrder] = useState<ShelfId[] | null>(null);
  const current = order ?? preferences.order;
  function persist(next: ShelfPreferences, changedShelf?: ShelfId) {
    setOrder(next.order);
    saveShelfPreferences(next);
    if (changedShelf && !preferences.enabled.includes(changedShelf)) {
      router.push(`/onboarding?shelf=${changedShelf}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
      <p className="text-sm text-neutral-400">Drag shelves into the order you want. Turning one back on starts its five-title setup.</p>
      <ShelfPreferenceEditor preferences={{ ...preferences, order: current }} onChange={persist} />
    </div>
  );
}
