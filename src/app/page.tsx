import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, apiFetch } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { GENERIC_OG_IMAGE_PATH } from '@/lib/ogCards';
import { HomeActivity, ActivitySkeleton } from '@/components/HomeActivity';
import { HomeTonight, TonightSkeleton } from '@/components/HomeTonight';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { HomeShelves } from '@/components/HomeShelves';
import { PublicLanding } from '@/components/PublicLanding';
import { TutorialLauncher } from '@/components/Tutorial';
import type { Summary } from '@/lib/types';

export const dynamic = 'force-dynamic';
// Complements the auth route's 4s exchange budget: credential callback to
// populated home should stay within 5s, substantially below the reported 15s.
const HOME_SUMMARY_BUDGET_MS = 1_000;

// Signed-in visitors keep the root layout's default title (see
// app/layout.tsx); a signed-out visitor gets marketing copy instead, mostly
// for link-preview cards when a shared Top 5 card's "view druthers" link
// resolves here.
export async function generateMetadata(): Promise<Metadata> {
  const user = await getSessionUser();
  if (user) return {};
  return {
    title: 'Druthers — your favorites, ranked',
    description:
      'Movies, TV, books, and games — watched, read, played, then ranked into the order you’d pick them again. Not ratings out of ten: druthers.',
    openGraph: {
      title: 'Druthers — your favorites, ranked',
      description:
        'Movies, TV, books, and games — ranked into the order you’d pick them again.',
      url: '/',
      images: [
        {
          url: GENERIC_OG_IMAGE_PATH,
          type: 'image/png',
          width: 1200,
          height: 630,
          alt: 'Druthers — your favorites, ranked',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Druthers — your favorites, ranked',
      description: 'Movies, TV, books, and games — ranked by your real choices.',
      images: [GENERIC_OG_IMAGE_PATH],
    },
  };
}

/**
 * `/`: a public marketing landing page for signed-out visitors (issue #27 —
 * the most likely arrival path is a shared Top 5 card, and a bare login form
 * doesn't sell the product), or your own Top 5 across all four shelves once
 * signed in.
 *
 * The summary is the only request needed for the primary content, and it
 * replaced four full-collection fetches (~1,400 movie rows alone) the page
 * used to pull just to count them. It now streams behind a page skeleton too,
 * so even a slow summary cannot hold the app shell blank. Tonight and Recent
 * activity remain secondary boundaries that resolve independently.
 */
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <PublicLanding
        googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}
      />
    );
  }

  // Start the primary request before rendering, but pass its promise through
  // the boundary instead of awaiting it here. That lets summary, schedule,
  // activity, and the header's preference lookup all run concurrently while
  // the shell is already visible.
  const summaryPromise = loadSummary();
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<HomeSkeleton />}>
        <SignedInHome summaryPromise={summaryPromise} />
      </Suspense>
      <Suspense fallback={<TonightSkeleton />}>
        <HomeTonight />
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <HomeActivity />
      </Suspense>
    </div>
  );
}

async function loadSummary(): Promise<Summary> {
  const startedAt = performance.now();
  try {
    return await apiFetch<Summary>('/v1/users/me/summary');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  } finally {
    const durationMs = performance.now() - startedAt;
    if (durationMs > HOME_SUMMARY_BUDGET_MS) {
      console.warn(
        `[home] /v1/users/me/summary exceeded ${HOME_SUMMARY_BUDGET_MS}ms budget (${durationMs.toFixed(0)}ms)`,
      );
    }
  }
}

async function SignedInHome({ summaryPromise }: { summaryPromise: Promise<Summary> }) {
  const summary = await summaryPromise;

  if (summary.needs_onboarding) {
    redirect('/onboarding');
  }

  const shareData = buildShareData(summary);
  const nothingRanked = summary.total_ranked === 0;

  return (
    <>
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

      <HomeShelves shelves={summary.shelves} />

      <TutorialLauncher hasItems={summary.total_items > 0} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading your home page">
      <div>
        <h1 className="font-display text-2xl text-paper">Your Top 5</h1>
        <p className="animate-pulse text-sm text-neutral-500">Loading your shelves…</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {['Movies', 'TV', 'Books', 'Games'].map((label) => (
          <div
            key={label}
            className="h-48 animate-pulse rounded-lg border border-line bg-panel"
            aria-label={`Loading ${label}`}
          />
        ))}
      </div>
    </div>
  );
}
