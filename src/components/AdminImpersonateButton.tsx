'use client';

import { useState } from 'react';

/**
 * The entry point into a read-only view-as session (#250). No confirmation:
 * impersonation is strictly read-only (the API refuses every write while
 * active), so there is no consequence here worth a dialog - unlike Disable,
 * which does something.
 *
 * Never rendered for a target who is an admin - that check lives in the
 * caller (AdminUserDetailView), since it needs the full user record this
 * component doesn't otherwise need.
 */
export function AdminImpersonateButton({ userId, handle }: { userId: string; handle: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_uuid: userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Could not view as @${handle}.`);
      }
      // Full navigation, not client nav: every server-rendered layout (the
      // banner, the ring, the /admin block screen) needs a clean request to
      // pick up the new impersonation cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not view as @${handle}.`);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
      >
        {busy ? 'Starting…' : `View as @${handle}`}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
