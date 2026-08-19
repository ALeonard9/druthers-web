import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireAdminUser } from '@/lib/adminAuth';
import { SectionTabs } from '@/components/SectionTabs';

// The list drives the tab rail. Reports/stats are a later increment (#249's
// INC 4/5) - adding a third entry here is the whole job when that lands, the
// rail already scrolls and doesn't hardcode a tab count.
const ADMIN_TABS = [
  { href: '/admin', label: 'Directory' },
  { href: '/admin/audit', label: 'Audit log' },
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
