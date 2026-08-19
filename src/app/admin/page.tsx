import { apiFetch } from '@/lib/api';
import { getImpersonationMeta } from '@/lib/session';
import type { AdminUserListResponse } from '@/lib/types';
import { AdminDirectory } from '@/components/AdminDirectory';

const PAGE_SIZE = 50;

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // AdminLayout already renders the block screen instead of {children}
  // while impersonating, but Next still invokes this page's own Server
  // Component function as part of resolving the route tree regardless of
  // whether the layout's JSX ends up referencing it. Without this check
  // this page's own apiFetch call still runs on the impersonated token,
  // gets refused 403 by the API's own admin gate, and that uncaught error
  // was observed live to turn the whole request into a 404 instead of the
  // layout's intended 200-with-block-screen. Bailing out here before the
  // fetch is what actually prevents that, not the layout's JSX shape alone.
  if (await getImpersonationMeta()) return null;

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';

  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });
  if (q) query.set('q', q);
  // Same URL AdminLayout's requireAdminUser() already fetched when q is
  // empty - Next's request memoization collapses the two into one call.
  const data = await apiFetch<AdminUserListResponse>(`/v1/admin/users?${query}`);

  // Keyed by the committed query: a genuinely new search remounts the
  // client component fresh instead of syncing new props into local state
  // via an effect (see AdminDirectory.tsx).
  return <AdminDirectory key={q} initialData={data} initialQuery={q} pageSize={PAGE_SIZE} />;
}
