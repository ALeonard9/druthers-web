import type { Notification } from './types';

// Forces a compile error the day a category is added to the union without a
// case below, rather than the old `default: return null` silently treating
// it as "no link" (#127).
function assertNever(value: never): never {
  throw new Error(`Unhandled notification category: ${String(value)}`);
}

/** Where a notification should navigate when clicked, if anywhere. */
export function notificationHref(n: Notification): string | null {
  if (!n.category) return null;
  switch (n.category) {
    case 'movie':
      return n.entity_id ? `/movies/${n.entity_id}` : null;
    case 'tv_show':
      return n.entity_id ? `/tv/${n.entity_id}` : null;
    case 'game':
      return n.entity_id ? `/games/${n.entity_id}` : null;
    case 'book':
      return n.entity_id ? `/books/${n.entity_id}` : null;
    case 'friend_request':
      // The friends page, not a per-request deep link: a resolved or
      // deleted request (#282 cleans those up) has nowhere else to point,
      // and the surface is the same regardless of which request this was.
      return '/friends';
    default:
      return assertNever(n.category);
  }
}

/** Badge text: exact count up to 9, then "9+" so the pill stays small. */
export function badgeLabel(unread: number): string | null {
  if (unread <= 0) return null;
  return unread > 9 ? '9+' : String(unread);
}
