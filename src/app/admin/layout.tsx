import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireAdminUser } from '@/lib/adminAuth';
import { getImpersonationMeta } from '@/lib/session';
import { SectionTabs } from '@/components/SectionTabs';
import { AdminBlockedWhileImpersonating } from '@/components/AdminBlockedWhileImpersonating';

// The list drives the tab rail. The rail scrolls rather than hardcoding a
// tab count, so the reports surface can live beside the console's directory
// and audit work without becoming a separate admin shell.
const ADMIN_TABS = [
  { href: '/admin', label: 'Directory' },
  { href: '/admin/audit', label: 'Audit log' },
  { href: '/admin/reports', label: 'Reports' },
];

export const dynamic = 'force-dynamic';

/**
 * Server-side gate for the whole `/admin` route group.
 *
 * This is the layer that actually matters - see lib/adminAuth.ts. A
 * non-admin (including one carrying a forged `aleonard_user` cookie) gets
 * notFound(), not a redirect or a 403 page: the console should not appear to
 * exist at all. The sidebar link is a separate, purely cosmetic decision
 * (Sidebar.tsx) and is not trusted here.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Checked before requireAdminUser(), not after: while impersonating,
  // getToken() (which apiFetch and therefore requireAdminUser() both go
  // through) resolves to the impersonated user's token, not the admin's own -
  // asking "is the current token an admin" would answer the wrong question
  // and would 404 an admin who is simply mid-view-as. Blocked, not hidden:
  // see AdminBlockedWhileImpersonating's own doc comment.
  const impersonation = await getImpersonationMeta();
  if (impersonation) {
    return <AdminBlockedWhileImpersonating meta={impersonation} />;
  }

  const user = await requireAdminUser();
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Admin
        </h1>
        <p className="text-sm text-neutral-400">
          Signed in as <span className="text-neutral-300">{user.email}</span>
        </p>
      </div>
      <SectionTabs tabs={ADMIN_TABS} />
      {children}
    </div>
  );
}
