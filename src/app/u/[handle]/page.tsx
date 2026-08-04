import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicProfile } from '@/lib/publicProfile';
import { PublicShelfCarousel } from '@/components/PublicShelfCarousel';
import { FollowButton } from '@/components/FollowButton';
import { CopyProfileLinkButton } from '@/components/CopyProfileLinkButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — Druthers`,
    description: `@${handle}’s druthers: their favorites, ranked.`,
  };
}

// A clone of the signed-in home page (#121), rescoped from the old compact
// hub (#93): Top 5 per shelf this viewer may see, minus the activity and
// schedule boxes those don't apply to a visitor. Which shelves show up, and
// whether this 404s at all, is entirely the API's call (#277) — resolved
// once into `profile.viewer` rather than re-derived here, so the page can't
// disagree with the endpoint about who gets to see what.
export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await fetchPublicProfile(handle);
  if (!profile) notFound();

  const nothingRanked = profile.total_ranked === 0;
  const shelfWord = profile.shelves.length === 1 ? 'shelf' : 'shelves';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
            @{profile.handle}
          </p>
          <h1 className="mt-1 font-display text-2xl text-paper">
            {profile.display_name ?? `@${profile.handle}`}’s Top 5
          </h1>
          <p className="text-sm text-neutral-500">
            {nothingRanked
              ? 'Nothing shared here yet.'
              : `${profile.total_ranked} ranked across ${profile.shelves.length} ${shelfWord}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile.viewer.relationship === 'friend' && (
            <span className="rounded-full bg-moss-wash px-2.5 py-1 text-xs font-medium text-moss">
              Friend
            </span>
          )}
          {profile.viewer.relationship === 'self' && (
            <span className="rounded-full bg-brass-wash px-2.5 py-1 text-xs font-medium text-brass">
              This is your profile
            </span>
          )}
          {profile.viewer.relationship === 'none' && (
            <FollowButton handle={profile.handle} initialFollowing={profile.viewer.following} />
          )}
          {profile.viewer.relationship === 'anonymous' && (
            <a
              href="/login"
              className="rounded border border-line px-3 py-1.5 text-sm text-neutral-300 hover:border-brass hover:text-paper"
            >
              Sign in to follow
            </a>
          )}
          <CopyProfileLinkButton handle={profile.handle} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {profile.shelves.map((shelf) => (
          <PublicShelfCarousel
            key={shelf.slug}
            handle={profile.handle}
            shelf={shelf}
          />
        ))}
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-600">
        www.druthers.io — your favorites, ranked
      </p>
    </div>
  );
}
