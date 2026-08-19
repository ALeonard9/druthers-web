import { apiFetch } from '@/lib/api';
import type { AdminAuditResponse } from '@/lib/types';
import { AdminAuditFilters } from '@/components/AdminAuditFilters';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const RESULT_STYLES: Record<string, string> = {
  allowed: 'text-moss',
  denied: 'text-plum',
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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
                  <td className="px-3 py-2 text-paper">
                    {event.actor.handle ?? event.actor.email}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-300">
                    {event.action}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">
                    {event.target ? (event.target.handle ?? event.target.email) : '-'}
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
