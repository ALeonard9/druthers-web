import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { BoredResponse } from '@/lib/types';
import { BoredCard } from '@/components/BoredCard';

export const dynamic = 'force-dynamic';

export default async function BoredPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let initial: BoredResponse | null = null;
  try {
    initial = await apiFetch<BoredResponse>('/v1/users/me/bored');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }

  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">I&apos;m Bored</h1>
        <p className="mt-1 text-sm text-neutral-400">
          One thing off your lists, drawn at random.
        </p>
      </div>
      <BoredCard initial={initial} />
    </div>
  );
}
