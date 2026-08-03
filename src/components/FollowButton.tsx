'use client';

import { useState } from 'react';

// One-way follow toggle for a public profile (#276/#121). Grants nothing —
// it's just a bookmark with a courtesy notification — so there's no
// confirmation step the way unfriending has one.
export function FollowButton({
  handle,
  initialFollowing,
}: {
  handle: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/follows/${handle}`, {
        method: following ? 'DELETE' : 'PUT',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Could not update.');
        return;
      }
      setFollowing(!following);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        title={following ? 'Unfollow' : undefined}
        className={
          following
            ? 'rounded border border-line px-3 py-1.5 text-sm text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50'
            : 'rounded bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50'
        }
      >
        {following ? 'Following' : 'Follow'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
