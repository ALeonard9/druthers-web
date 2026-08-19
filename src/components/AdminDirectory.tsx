'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AdminUserListResponse, AdminUserRow } from '@/lib/types';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const DEBOUNCE_MS = 250;

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-moss-wash text-moss',
  disabled: 'bg-plum-wash text-plum',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${
        STATUS_STYLES[status] ?? 'bg-line text-neutral-400'
      }`}
    >
      {status}
    </span>
  );
}

function HandleCell({ user }: { user: AdminUserRow }) {
  return (
    <Link href={`/admin/users/${user.id}`} className="block hover:underline">
      <span className="block text-paper">{user.handle}</span>
      {user.display_name && (
        <span className="block text-xs text-neutral-500">{user.display_name}</span>
      )}
    </Link>
  );
}

// Never "last active" - see lib/types.ts's AdminUserRow doc. This is the
// only field the API can back today: it means the account wrote something,
// not that anyone signed in.
function LastTracked({ at }: { at: string | null }) {
  if (!at) return <span className="text-neutral-500">Never</span>;
  return <span title={exactTimestamp(at)}>{relativeTimeFrom(at)}</span>;
}

function Joined({ at }: { at: string }) {
  return <span title={exactTimestamp(at)}>{relativeTimeFrom(at)}</span>;
}

export function AdminDirectory({
  initialData,
  initialQuery,
  pageSize,
}: {
  initialData: AdminUserListResponse;
  initialQuery: string;
  pageSize: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState(initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // A fresh server render (typed search committed, or a Back/Forward nav)
  // lands here as new initial props. Rather than syncing them into state
  // with an effect, the page keys this component by the committed query
  // (see admin/page.tsx) so a genuinely new search remounts it and these
  // useState initializers just run again.

  // Debounced search-as-you-type: no submit button, ~250ms after the last
  // keystroke the query commits to the URL, which re-runs the server page
  // and streams back a fresh result set. Synced to ?q= so a result is
  // linkable and the browser Back button returns to the prior search.
  useEffect(() => {
    if (query === initialQuery) return;
    const handle = setTimeout(() => {
      const url = query ? `/admin?q=${encodeURIComponent(query)}` : '/admin';
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, initialQuery, router]);

  async function loadMore() {
    setLoadingMore(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(data.users.length),
      });
      if (query) params.set('q', query);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Load more failed');
      const next: AdminUserListResponse = await res.json();
      setData((prev) => ({ ...next, users: [...prev.users, ...next.users] }));
    } catch {
      setLoadError('Could not load more users. Try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = data.users.length < data.total;
  const searching = isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, handle, or email…"
          aria-label="Search users"
          className="w-full max-w-sm rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper placeholder:text-neutral-500 focus:border-brass focus:outline-none"
        />
        <p className="text-xs text-neutral-500">
          {searching ? 'Searching…' : `${data.users.length} of ${data.total} users`}
        </p>
      </div>

      {data.users.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-line bg-panel px-4 py-6">
          <p className="text-sm text-neutral-300">
            {query ? `No users match “${query}”.` : 'No users found.'}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-sm text-brass hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop / tablet: a real table. */}
          <div className="hidden overflow-x-auto rounded-lg border border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Handle</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Last tracked</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-3 py-2 text-right font-medium">Tracked</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">
                      <HandleCell user={u} />
                    </td>
                    <td className="px-3 py-2 text-neutral-300">{u.email}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      <LastTracked at={u.last_tracked_at} />
                    </td>
                    <td className="px-3 py-2 text-neutral-400">
                      <Joined at={u.created_at} />
                    </td>
                    <td className="px-3 py-2 text-right text-neutral-300">
                      {u.tracked_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Below md: a stacked list, not a table forced to reflow. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {data.users.map((u) => (
              <li key={u.id} className="rounded-lg border border-line px-3 py-2">
                <Link href={`/admin/users/${u.id}`} className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-paper">{u.handle}</span>
                    {u.display_name && (
                      <span className="block truncate text-xs text-neutral-500">
                        {u.display_name}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={u.status} />
                    <span className="text-[11px] text-neutral-500">
                      <LastTracked at={u.last_tracked_at} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {loadError && <p className="text-sm text-plum">{loadError}</p>}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="self-start rounded-lg border border-line px-4 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
