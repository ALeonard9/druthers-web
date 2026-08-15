import type { ExtraField } from '@/components/FilterBar';
import type { UserTVShow } from './types';
import { optionsWithCounts } from './filterParams';

/**
 * The four values the API can report for a user's progress through a show.
 * A fixed enum (see WatchStatus), not derived from the data - otherwise a
 * status you happen to have none of right now would vanish from the menu.
 */
const WATCH_STATUS: { value: string; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'behind', label: 'Behind' },
  { value: 'up_to_date', label: 'Up to date' },
  { value: 'complete', label: 'Complete' },
];

/** Shared by the TV rankings and watchlist pages so the menus can't drift. */
export function tvExtras(shows: UserTVShow[]): ExtraField[] {
  return [
    {
      kind: 'select',
      name: 'status',
      label: 'Show status',
      options: optionsWithCounts(shows.map((s) => s.tv_show.status)),
    },
    {
      kind: 'select',
      name: 'watchStatus',
      label: 'My progress',
      options: WATCH_STATUS,
    },
  ];
}
