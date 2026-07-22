import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { HomeActivity, ActivitySkeleton } from '@/components/HomeActivity';
import { HomeTonight, TonightSkeleton } from '@/components/HomeTonight';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { Top5Board } from '@/components/Top5Board';
import type { Summary } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * The landing page: your Top 5 across all four shelves.
 *
 * Only the summary is awaited before first paint — one bounded request that
 * replaced four full-collection fetches (~1,400 movie rows alone) the page
 * used to pull just to count them. Tonight and Recent activity are real but
 * secondary, so they stream in behind their own Suspense boundaries instead
 * of holding up the shelves.
 */
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let summary: Summary;
  try {
    summary = await apiFetch<Summary>('/v1/users/me/summary');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const shareData = buildShareData(summary);
  const nothingRanked = summary.total_ranked === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-paper">Your Top 5</h1>
          <p className="text-sm text-neutral-500">
            {nothingRanked
              ? 'Rank something and it lands here.'
              : `${summary.total_ranked} ranked across four shelves.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button data={shareData} />
          <Link
            href="/surprise"
            className="rounded border border-line px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-brass hover:text-paper"
          >
            Surprise me
          </Link>
        </div>
      </div>

      {/* Claiming a handle is what turns a share card into a working link. */}
      {!shareData.profilePublic && !nothingRanked && (
        <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-neutral-400">
          {summary.handle
            ? 'Your profile is private, so shared cards link to the site rather than your lists.'
            : 'Claim a handle to get a shareable profile link.'}{' '}
          <Link href="/settings" className="text-brass hover:text-brass-bright">
            Open sharing settings
          </Link>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {summary.shelves.map((shelf) => (
          <Top5Board key={shelf.category} shelf={shelf} />
        ))}
      </div>

      <Suspense fallback={<TonightSkeleton />}>
        <HomeTonight />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <HomeActivity />
      </Suspense>
    </div>
  );
}
