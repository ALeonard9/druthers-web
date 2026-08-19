'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdminDomainCounts, AdminUserDetail } from '@/lib/types';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const DOMAIN_LABELS: Record<keyof AdminUserDetail['domains'], string> = {
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Games',
};

const VISIBILITY_ROWS: [keyof AdminUserDetail['visibility'], string][] = [
  ['profile', 'Profile'],
  ['default_privacy', 'Default'],
  ['movies', 'Movies'],
  ['tv', 'TV'],
  ['books', 'Books'],
  ['games', 'Games'],
  ['watchlist_movies', 'Watchlist - movies'],
  ['watchlist_tv', 'Watchlist - TV'],
  ['watchlist_books', 'Watchlist - books'],
  ['watchlist_games', 'Watchlist - games'],
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-moss-wash text-moss',
  disabled: 'bg-plum-wash text-plum',
};

export function AdminUserDetailView({ initialUser }: { initialUser: AdminUserDetail }) {
  const [user, setUser] = useState(initialUser);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: 'disable' | 'enable') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/${action}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Guard errors are specific ("You cannot disable your own account")
        // - show them as-is rather than a generic failure.
        throw new Error(data?.error || `Could not ${action} this account.`);
      }
      setUser(data as AdminUserDetail);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} this account.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-xs text-neutral-500 hover:text-paper">
          &larr; Directory
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-paper">{user.handle}</h2>
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
              STATUS_STYLES[user.status] ?? 'bg-line text-neutral-400'
            }`}
          >
            {user.status}
          </span>
          {user.status === 'active' ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="ml-auto rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-950/40 disabled:opacity-50"
            >
              Disable account
            </button>
          ) : (
            // Enable is restorative and trivially undone - no confirmation.
            // Confirming it too would just train people to dismiss dialogs,
            // which is what makes the disable confirm below worthless.
            <button
              type="button"
              onClick={() => void runAction('enable')}
              disabled={busy}
              className="ml-auto rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
            >
              {busy ? 'Enabling…' : 'Enable account'}
            </button>
          )}
        </div>
        {user.display_name && (
          <p className="text-sm text-neutral-400">{user.display_name}</p>
        )}
        <p className="text-sm text-neutral-400">{user.email}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Joined{' '}
          <span title={exactTimestamp(user.created_at)}>
            {relativeTimeFrom(user.created_at)}
          </span>
          {' · '}
          Last tracked{' '}
          {user.last_tracked_at ? (
            <span title={exactTimestamp(user.last_tracked_at)}>
              {relativeTimeFrom(user.last_tracked_at)}
            </span>
          ) : (
            'never'
          )}
        </p>

        {confirming && (
          <div className="mt-4 rounded-lg border border-red-950 bg-red-950/20 px-4 py-4">
            <p className="text-sm text-neutral-300">
              Disabling <span className="text-paper">@{user.handle}</span> signs them out
              immediately and they cannot sign in again until re-enabled. Their data is
              kept. Their API keys and sessions are <span className="text-paper">not</span>{' '}
              restored on re-enable - they will have to sign in again and re-create any
              keys.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void runAction('disable')}
                disabled={busy}
                className="rounded bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Disabling…' : `Disable @${user.handle}`}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded border border-line px-3 py-2 text-sm text-neutral-300 hover:text-paper disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Shelves</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(DOMAIN_LABELS) as (keyof AdminUserDetail['domains'])[]).map(
            (domain) => (
              <DomainCard
                key={domain}
                label={DOMAIN_LABELS[domain]}
                counts={user.domains[domain]}
              />
            ),
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Visibility</h3>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {VISIBILITY_ROWS.map(([key, label]) => (
                <tr key={key} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-neutral-400">{label}</td>
                  <td className="px-3 py-2 text-paper">
                    {String(user.visibility[key] ?? 'default')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2 text-neutral-400">Share activity</td>
                <td className="px-3 py-2 text-paper">
                  {user.visibility.share_activity ? 'On' : 'Off'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Social</h3>
        <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
          <SocialCard label="Friends" value={user.social.friends} />
          <SocialCard label="Followers" value={user.social.followers} />
          <SocialCard label="Following" value={user.social.following} />
        </div>
      </section>
    </div>
  );
}

function DomainCard({ label, counts }: { label: string; counts: AdminDomainCounts }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-display text-xl text-paper">{counts.total}</p>
      <p className="text-[11px] text-neutral-500">
        {counts.ranked} ranked · {counts.watchlist} watchlist
      </p>
    </div>
  );
}

function SocialCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2 text-center">
      <p className="font-display text-xl text-paper">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
