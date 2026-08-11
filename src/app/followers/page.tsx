import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Follow, Visibility } from '@/lib/types';

export const dynamic = 'force-dynamic';

// The API owns both the public-profile rule and the follow relationships.
// Fetching these on the server keeps the count out of client-side stubs and
// avoids displaying a stale count after a profile is made private.
export default async function FollowersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const visibility = await apiFetch<Visibility>('/v1/users/me/visibility');
  const isPublic = visibility.visibility_profile === 'public';
  const followers = isPublic
    ? await apiFetch<Follow[]>('/v1/users/me/followers')
    : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Followers
        </h1>
        <p className="text-sm text-neutral-400">
          Track the people following your public profile.
        </p>
      </div>

      {followers === null ? (
        <section className="rounded-lg border border-line bg-panel px-4 py-5">
          <h2 className="font-display text-lg text-paper">Make your profile public to track followers</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Followers are only available for public profiles. Change your profile sharing
            setting to start tracking your audience.
          </p>
          <Link
            href="/settings#sharing"
            className="mt-4 inline-block text-sm text-brass hover:text-brass-bright"
          >
            Go to sharing settings
          </Link>
        </section>
      ) : (
        <section className="rounded-lg border border-line bg-panel px-4 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Current audience
          </p>
          <p className="mt-2 font-display text-5xl text-paper">{followers.length}</p>
          <p className="mt-1 text-sm text-neutral-400">
            {followers.length === 1 ? 'person follows' : 'people follow'} your profile.
          </p>
          <Link
            href="/friends"
            className="mt-4 inline-block text-sm text-brass hover:text-brass-bright"
          >
            View followers
          </Link>
        </section>
      )}
    </div>
  );
}
