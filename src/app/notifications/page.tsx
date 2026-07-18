import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Notification } from '@/lib/types';
import { NotificationRow } from '@/components/NotificationRow';
import { MarkAllReadButton } from '@/components/MarkAllReadButton';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let notifications: Notification[];
  try {
    notifications = await apiFetch<Notification[]>('/v1/users/me/notifications');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Notifications</h1>
          <p className="text-sm text-neutral-400">
            Releases and other events from your lists.
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-neutral-500">No notifications yet.</p>
      ) : (
        <ul className="rounded-lg border border-line bg-panel">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
      )}
    </div>
  );
}
