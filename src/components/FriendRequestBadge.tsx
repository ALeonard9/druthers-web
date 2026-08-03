import { apiFetch } from '@/lib/api';
import { badgeLabel } from '@/lib/notifications';
import type { PendingFriendRequests } from '@/lib/types';

/**
 * The incoming-friend-request count on the top bar's Friends icon (#120).
 *
 * Same streamed-decoration shape as UnreadBadge: sits in the root layout via
 * TopBar, so it renders in Suspense rather than delaying the page shell.
 */
export async function FriendRequestBadge() {
  let incoming = 0;
  try {
    const requests = await apiFetch<PendingFriendRequests>(
      '/v1/users/me/friends/requests',
    );
    incoming = requests.incoming.length;
  } catch {
    return null;
  }

  const badge = badgeLabel(incoming);
  if (!badge) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-semibold text-ink">
      {badge}
    </span>
  );
}
