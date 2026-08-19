import { apiFetch } from '@/lib/api';
import type { AdminUserListResponse } from '@/lib/types';
import { AdminDirectory } from '@/components/AdminDirectory';

const PAGE_SIZE = 50;

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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
