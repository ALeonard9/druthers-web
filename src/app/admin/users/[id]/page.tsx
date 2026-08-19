import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminUserDetail } from '@/lib/types';
import { AdminUserDetailView } from '@/components/AdminUserDetailView';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  return <AdminUserDetailView initialUser={user} />;
}
