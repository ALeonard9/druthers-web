import type { BoredItem } from './types';

/** Where this pick's title should link to. */
export function boredHref(item: BoredItem): string {
  switch (item.category) {
    case 'movie':
      return `/movies/${item.entity_id}`;
    case 'tv_show':
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
