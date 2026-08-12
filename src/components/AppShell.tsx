import type { ReactNode } from 'react';
import { Sidebar, BottomTabs } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { RefreshHomeOnReturn } from '@/components/RefreshHomeOnReturn';
import type { SessionUser } from '@/lib/types';

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser | null;
}) {
  if (!user) {
    return <main className="min-h-screen px-4 py-8 md:px-8">{children}</main>;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>
      <BottomTabs />
      <RefreshHomeOnReturn />
    </>
  );
}
