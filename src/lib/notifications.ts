import type { Notification } from './types';

/** Where a notification should navigate when clicked, if anywhere. */
export function notificationHref(n: Notification): string | null {
  if (!n.category || !n.entity_id) return null;
  switch (n.category) {
    case 'movie':
      return `/movies/${n.entity_id}`;
    case 'tv_show':
      return `/tv/${n.entity_id}`;
    case 'game':
      return `/games/${n.entity_id}`;
    case 'book':
      return `/books/${n.entity_id}`;
    case 'country':
      return `/countries/${n.entity_id}`;
    default:
      return null;
  }
}

/** Badge text: exact count up to 9, then "9+" so the pill stays small. */
export function badgeLabel(unread: number): string | null {
  if (unread <= 0) return null;
  return unread > 9 ? '9+' : String(unread);
}
