import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Summary } from '@/lib/types';
import { OnboardingWizard } from '@/components/OnboardingWizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let summary: Summary;
  try {
    summary = await apiFetch<Summary>('/v1/users/me/summary');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  if (summary.onboarding_completed) {
    redirect('/');
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-8">
      <OnboardingWizard summary={summary} />
    </div>
  );
}
