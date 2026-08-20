import { apiFetch } from '@/lib/api';
import { getImpersonationMeta } from '@/lib/session';
import type { AdminAuditResponse, AdminLiveSessionList } from '@/lib/types';
import { AdminAuditFilters } from '@/components/AdminAuditFilters';
import { AdminAuditTable } from '@/components/AdminAuditTable';
import { AdminLiveSessions } from '@/components/AdminLiveSessions';

const PAGE_SIZE = 50;

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

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });
  if (actor) params.set('actor', actor);
  if (target) params.set('target', target);
  if (action) params.set('action', action);

  const [data, liveSessions] = await Promise.all([
    apiFetch<AdminAuditResponse>(`/v1/admin/audit?${params}`),
    apiFetch<AdminLiveSessionList>('/v1/admin/impersonation'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AdminLiveSessions initialSessions={liveSessions.sessions} />
      <div className="flex flex-col gap-4">
        <AdminAuditFilters initial={{ actor, target, action }} />
        <AdminAuditTable
          key={`${actor}|${target}|${action}`}
          initialData={data}
          filters={{ actor, target, action }}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
