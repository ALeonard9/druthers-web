'use client';

import { useMemo, useState } from 'react';
import type { AdminAuditActor, AdminAuditEvent, AdminAuditResponse } from '@/lib/types';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const RESULT_STYLES: Record<string, string> = {
  allowed: 'text-moss',
  denied: 'text-plum',
};

// Every field on an actor/target is independently nullable - an actor can
// even be entirely absent, for a denial that never resolved to an account
// (an expired-token request, for instance). Falls back through the same
// handle -> email -> "unknown" chain personLabel uses for impersonation.
function actorLabel(actor: AdminAuditActor | null): string {
  if (!actor) return 'Unknown';
  return actor.handle ?? actor.email ?? 'Unknown';
}

// The one action that reliably drowns out everything else: one row per
// debounced keystroke batch on the directory search box, which in practice
// outnumbers every actual admin action combined. Hidden by default (see
// hideSearches below) rather than excluded server-side, since the API has
// no "exclude this action" param and the raw trail still needs to be
// reachable for someone who genuinely wants to see search activity.
const NOISY_ACTION = 'admin.user.search';

export function AdminAuditTable({
  initialData,
  filters,
  pageSize,
}: {
  initialData: AdminAuditResponse;
  filters: { actor: string; target: string; action: string };
  pageSize: number;
}) {
  const [data, setData] = useState(initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Defaults to hiding the noise: the four events anyone opens this page to
  // find (disable, enable, impersonation start/stop) are otherwise buried
  // under one admin.user.search row per debounced keystroke batch. Off is
  // one click away for anyone who wants the literal unfiltered trail.
  const [hideSearches, setHideSearches] = useState(true);

  const hasFilter = Boolean(filters.actor || filters.target || filters.action);
  const searchNoiseCount = useMemo(
    () => data.events.filter((e) => e.action === NOISY_ACTION).length,
    [data.events],
  );
  const visibleEvents = hideSearches
    ? data.events.filter((e) => e.action !== NOISY_ACTION)
    : data.events;
  const hasMore = data.events.length < data.total;

  async function loadMore() {
    setLoadingMore(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(data.events.length),
      });
      if (filters.actor) params.set('actor', filters.actor);
      if (filters.target) params.set('target', filters.target);
      if (filters.action) params.set('action', filters.action);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Load more failed');
      const next: AdminAuditResponse = await res.json();
      setData((prev) => ({ ...next, events: [...prev.events, ...next.events] }));
    } catch {
      setLoadError('Could not load more events. Try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-500">
          {visibleEvents.length} of {data.total} events
          {hideSearches && searchNoiseCount > 0 && ` (${searchNoiseCount} searches hidden)`}
        </p>
        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={hideSearches}
            onChange={(e) => setHideSearches(e.target.checked)}
            className="accent-brass"
          />
          Hide routine searches
        </label>
      </div>

      {visibleEvents.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel px-4 py-6 text-sm text-neutral-300">
          {hasFilter
            ? 'No audit events match these filters.'
            : hideSearches && data.events.length > 0
              ? 'Nothing but routine searches on this page - try "Hide routine searches" off.'
              : 'No audit events yet. Admin actions will show up here.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Actor</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Result</th>
                <th className="px-3 py-2 font-medium">Path</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((event: AdminAuditEvent) => (
                <tr key={event.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-400">
                    <span title={exactTimestamp(event.created_at)}>
                      {relativeTimeFrom(event.created_at)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-paper">{actorLabel(event.actor)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-300">
                    {event.action}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">
                    {event.target ? actorLabel(event.target) : '-'}
                  </td>
                  <td
                    className={`px-3 py-2 font-medium ${RESULT_STYLES[event.result] ?? 'text-neutral-400'}`}
                  >
                    {event.result}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                    {event.method} {event.path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loadError && <p className="text-sm text-plum">{loadError}</p>}

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="self-start rounded-lg border border-line px-4 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
