import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getImpersonationMeta } from '@/lib/session';
import type { AdminUserDetail } from '@/lib/types';
import { AdminUserDetailView } from '@/components/AdminUserDetailView';

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // See admin/page.tsx's comment on the same check. This page's own 403 ->
  // notFound() mapping below is no protection here either: notFound() while
  // impersonating would still replace AdminLayout's block screen with
  // Next's built-in not-found page instead of leaving it alone, the same
  // failure mode this check exists to prevent.
  if (await getImpersonationMeta()) return null;

  const { id } = await params;
  const sp = await searchParams;
  // Set by /api/admin/expire (#250) when apiFetch caught a 401/403 on an
  // expired impersonation token elsewhere in the app and landed the admin
  // back here rather than signing them out. impersonation_expired is a
  // separate marker from the handle on purpose - the target can genuinely
  // have no handle, and the notice still needs to show in that case.
  const impersonationExpired = sp.impersonation_expired === '1';
  const expiredHandle = sp.impersonation_handle;
  // Set by ImpersonationEscapeButton (#250) when the stop call could not
  // confirm the session actually ended server-side - the local cookies are
  // always cleared regardless, but this must not read as "you are back and
  // it's over" when it might not be.
  const stopWarning = sp.impersonation_stop_warning === '1';

  let user: AdminUserDetail;
  try {
    user = await apiFetch<AdminUserDetail>(`/v1/admin/users/${encodeURIComponent(id)}`);
  } catch (err) {
    // A refused or missing lookup both read as "not here" to a caller who
    // already passed the route-level admin gate - a 404-shaped id and a
    // 403 on a single-user lookup are equally uninformative to show raw.
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  return (
    <AdminUserDetailView
      initialUser={user}
      impersonationExpired={impersonationExpired}
      expiredImpersonationHandle={expiredHandle || undefined}
      impersonationStopWarning={stopWarning}
    />
  );
}
