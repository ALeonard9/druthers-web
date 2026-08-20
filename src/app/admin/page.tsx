import { apiFetch } from '@/lib/api';
import { getImpersonationMeta } from '@/lib/session';
import type { AdminUserListResponse } from '@/lib/types';
import { AdminDirectory, type AdminSortColumn, type AdminSortDirection } from '@/components/AdminDirectory';

const PAGE_SIZE = 50;
const SORT_COLUMNS: AdminSortColumn[] = ['joined', 'last_tracked', 'tracked_total', 'status'];
const STATUSES = ['active', 'disabled'] as const;

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
  const status = STATUSES.find((s) => s === sp.status) ?? '';
  const sort = SORT_COLUMNS.find((s) => s === sp.sort);
  const direction: AdminSortDirection = sp.direction === 'asc' ? 'asc' : 'desc';

  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (sort) query.set('sort', sort);
  if (sort) query.set('direction', direction);
  // Same URL AdminLayout's requireAdminUser() already fetched when there is
  // no filter and no explicit sort - Next's request memoization collapses
  // the two into one call.
  const data = await apiFetch<AdminUserListResponse>(`/v1/admin/users?${query}`);

  // The corpus size, independent of the current search/status filter - a
  // filtered `total` means "0 of 0 users" on a search that matches nothing,
  // which reads as an empty database rather than a search with no hits.
  // Only worth the extra request when actually filtering.
  const isFiltered = Boolean(q || status);
  const corpusTotal = isFiltered
    ? (await apiFetch<AdminUserListResponse>('/v1/admin/users?limit=1&offset=0')).total
    : data.total;

  // Keyed by the committed query/status/sort: a genuinely new search or
  // sort remounts the client component fresh instead of syncing new props
  // into local state via an effect (see AdminDirectory.tsx).
  return (
    <AdminDirectory
      key={`${q}|${status}|${sort}|${direction}`}
      initialData={data}
      initialQuery={q}
      initialStatus={status}
      initialSort={sort}
      initialDirection={direction}
      pageSize={PAGE_SIZE}
      corpusTotal={corpusTotal}
    />
  );
}
