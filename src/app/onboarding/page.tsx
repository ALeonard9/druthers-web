import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Summary } from '@/lib/types';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import type { ShelfId } from '@/lib/duelShelves';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let summary: Summary;
  try {
    summary = await apiFetch<Summary>('/v1/users/me/summary');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const requestedShelf = (await searchParams).shelf;
  const shelf = ['movies', 'tv', 'books', 'games'].includes(requestedShelf ?? '')
    ? (requestedShelf as ShelfId)
    : undefined;

  if (!summary.needs_onboarding && !shelf) {
    redirect('/');
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-8">
      <OnboardingWizard summary={summary} shelfToSetUp={shelf} />
    </div>
  );
}
