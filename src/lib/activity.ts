import type { ActivityItem } from './types';

/** Group activity items by their occurred_at calendar day (UTC), newest first preserved. */
export function groupActivityByDay(
  items: ActivityItem[],
): { day: string; items: ActivityItem[] }[] {
  const groups: { day: string; items: ActivityItem[] }[] = [];
  const byDay = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const day = item.occurred_at.slice(0, 10);
    if (!byDay.has(day)) {
      byDay.set(day, []);
      groups.push({ day, items: byDay.get(day)! });
    }
    byDay.get(day)!.push(item);
  }
  return groups;
}

const CATEGORY_LABELS: Record<ActivityItem['category'], string> = {
  movie: 'Movie',
  tv_show: 'TV Show',
  tv_episode: 'Episode',
  game: 'Game',
  book: 'Book',
  country: 'Country',
};

export function categoryLabel(category: ActivityItem['category']): string {
  return CATEGORY_LABELS[category];
}

const DONE_VERB: Record<ActivityItem['category'], string> = {
  movie: 'Watched',
  tv_show: 'Finished',
  tv_episode: 'Watched',
  game: 'Played',
  book: 'Read',
  country: 'Visited',
};

const WATCHLIST_LABEL: Record<ActivityItem['category'], string> = {
  movie: 'Added to watchlist',
  tv_show: 'Added to watchlist',
  tv_episode: 'Added to watchlist',
  game: 'Added to backlog',
  book: 'Added to to-read',
  country: 'Added to bucket list',
};

/** Human label for the action taken, e.g. "Ranked #3", "Watched", "Added to watchlist". */
export function describeActivity(item: ActivityItem): string {
  switch (item.action) {
    case 'ranked':
      return `Ranked #${item.rank}`;
    case 'marked_done':
      return DONE_VERB[item.category];
    case 'watched_episode':
      return 'Watched';
    case 'watchlist_added':
    default:
      return WATCHLIST_LABEL[item.category];
  }
}

/** Where this item's title should link to. */
export function activityHref(item: ActivityItem): string {
  switch (item.category) {
    case 'movie':
      return `/movies/${item.entity_id}`;
    case 'tv_show':
    case 'tv_episode':
      return `/tv/${item.entity_id}`;
    case 'game':
      return `/games/${item.entity_id}`;
    case 'book':
      return `/books/${item.entity_id}`;
    case 'country':
      return `/countries/${item.entity_id}`;
    default:
      return '/';
  }
}
