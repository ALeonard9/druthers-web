'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markAllRead() {
    startTransition(async () => {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      router.refresh();
    });
  }

  return (
    <button
      onClick={markAllRead}
      disabled={pending}
      className="rounded bg-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
    >
      Mark all read
    </button>
  );
}
