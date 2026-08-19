import { apiFetch } from '@/lib/api';
import { getImpersonationMeta } from '@/lib/session';
import type { AdminAuditActor, AdminAuditResponse } from '@/lib/types';
import { AdminAuditFilters } from '@/components/AdminAuditFilters';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const RESULT_STYLES: Record<string, string> = {
  allowed: 'text-moss',
  denied: 'text-plum',
};

// Every field on an actor/target is independently nullable (see the doc
// comment on AdminAuditActor) - an actor can even be entirely absent, for a
// denial that never resolved to an account. Falls back through the same
// handle -> email -> "unknown" chain personLabel uses for impersonation.
function actorLabel(actor: AdminAuditActor | null): string {
  if (!actor) return 'Unknown';
  return actor.handle ?? actor.email ?? 'Unknown';
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // See admin/page.tsx's comment on the same check - AdminLayout renders the
  // impersonation block screen instead of {children}, but Next still
  // invokes this page's own Server Component regardless, so its own
  // apiFetch call needs to bail out here rather than run on the
  // impersonated token and throw an uncaught 403.
  if (await getImpersonationMeta()) return null;

  const sp = await searchParams;
  const actor = sp.actor?.trim() ?? '';
  const target = sp.target?.trim() ?? '';
  const action = sp.action?.trim() ?? '';

  const params = new URLSearchParams({ limit: '50', offset: '0' });
  if (actor) params.set('actor', actor);
  if (target) params.set('target', target);
  if (action) params.set('action', action);

  const data = await apiFetch<AdminAuditResponse>(`/v1/admin/audit?${params}`);
  const hasFilter = Boolean(actor || target || action);

  return (
    <div className="flex flex-col gap-4">
      <AdminAuditFilters initial={{ actor, target, action }} />
      <p className="text-xs text-neutral-500">
        {data.events.length} of {data.total} events
      </p>

      {data.events.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel px-4 py-6 text-sm text-neutral-300">
          {hasFilter
            ? 'No audit events match these filters.'
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
              {data.events.map((event) => (
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
                  <td className={`px-3 py-2 font-medium ${RESULT_STYLES[event.result] ?? 'text-neutral-400'}`}>
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
    </div>
  );
}
