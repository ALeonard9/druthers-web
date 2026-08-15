import type { ReactNode } from 'react';
import { Sidebar, BottomTabs } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { RefreshHomeOnReturn } from '@/components/RefreshHomeOnReturn';
import { SiteFooter } from '@/components/SiteFooter';
import type { SessionUser } from '@/lib/types';
import type { ShelfId } from '@/lib/duelShelves';

export function AppShell({
  children,
  user,
  activeShelves,
}: {
  children: ReactNode;
  user: SessionUser | null;
  activeShelves?: ShelfId[];
}) {
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-8 md:px-8">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} activeShelves={activeShelves} />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pb-8">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </main>
        </div>
      </div>
      <BottomTabs />
      <RefreshHomeOnReturn />
    </>
  );
}
