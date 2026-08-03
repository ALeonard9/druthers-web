import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { FriendsManager } from '@/components/FriendsManager';

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Friends
        </h1>
        <p className="text-sm text-neutral-400">
          Add a friend by their exact handle — there&apos;s no directory, so
          this is the only way to reach someone.
        </p>
      </div>
      <FriendsManager />
    </div>
  );
}
