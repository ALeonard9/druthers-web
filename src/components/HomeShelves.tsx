'use client';

import { HomeShelfCarousel } from '@/components/HomeShelfCarousel';
import { orderedEnabledShelves } from '@/lib/shelfPreferences';
import { useShelfPreferences } from '@/lib/useShelfPreferences';
import type { SummaryShelf } from '@/lib/types';

export function HomeShelves({ shelves }: { shelves: SummaryShelf[] }) {
  const preferences = useShelfPreferences();
  const byCategory = new Map(shelves.map((shelf) => [shelf.category, shelf]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orderedEnabledShelves(preferences).flatMap((id) => {
        const shelf = byCategory.get(id);
        return shelf ? [<HomeShelfCarousel key={shelf.category} shelf={shelf} />] : [];
      })}
    </div>
  );
}
