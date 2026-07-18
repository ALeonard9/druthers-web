'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notificationHref } from '@/lib/notifications';
import type { Notification } from '@/lib/types';

// One notification line — links to its entity and marks read in place
// (the badge and list re-fetch via router.refresh()).
export function NotificationRow({ notification }: { notification: Notification }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const href = notificationHref(notification);

  function markRead() {
    startTransition(async () => {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PUT',
      });
      router.refresh();
    });
  }

  const title = href ? (
    <Link href={href} className="font-medium hover:underline">
      {notification.title}
    </Link>
  ) : (
    <span className="font-medium">{notification.title}</span>
  );

  return (
    <li
      className={`flex items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-b-0 ${
        notification.read ? 'opacity-60' : ''
      }`}
    >
      {!notification.read && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-brass" />
      )}
      <span className="flex-1">
        {title}
        {notification.body && (
          <span className="block text-xs text-neutral-400">
            {notification.body}
          </span>
        )}
      </span>
      {!notification.read && (
        <button
          onClick={markRead}
          disabled={pending}
          className="shrink-0 rounded bg-neutral-700 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
        >
          Mark read
        </button>
      )}
    </li>
  );
}
