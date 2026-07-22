import { apiFetch } from '@/lib/api';
import { badgeLabel } from '@/lib/notifications';
import type { UnreadCount } from '@/lib/types';

/**
 * The notification count on the top bar's bell.
 *
 * Split out of TopBar and streamed: the bar sits in the root layout, so
 * awaiting this API call there delayed the static shell of *every* page for
 * a piece of pure decoration. Absent until it resolves — which is also what
 * "no unread" looks like.
 */
export async function UnreadBadge() {
  let unread = 0;
  try {
    const count = await apiFetch<UnreadCount>(
      '/v1/users/me/notifications/unread-count',
    );
    unread = count.unread;
  } catch {
    // Decoration — never let an API blip take down the bar.
    return null;
  }

  const badge = badgeLabel(unread);
  if (!badge) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-semibold text-ink">
      {badge}
    </span>
  );
}
