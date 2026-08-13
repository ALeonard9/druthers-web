import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ActivityFeed } from '@/components/ActivityFeed';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { ActivityItem, Friend, Follow, SocialActivityPage } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORIES: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv_show', label: 'TV Shows' },
  { value: 'tv_episode', label: 'Episodes' },
  { value: 'game', label: 'Games' },
  { value: 'book', label: 'Books' },
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { category } = await searchParams;
  const activityParams = new URLSearchParams();
  if (category) activityParams.set('category', category);
  const activityPath = `/v1/users/me/activity${activityParams.size ? `?${activityParams}` : ''}`;

  let ownItems: ActivityItem[];
  let socialPage: SocialActivityPage;
  let friends: Friend[];
  let following: Follow[];
  try {
    [ownItems, socialPage, friends, following] = await Promise.all([
      apiFetch<ActivityItem[]>(activityPath),
      apiFetch<SocialActivityPage>('/v1/users/me/feed?limit=50'),
      apiFetch<Friend[]>('/v1/users/me/friends'),
      apiFetch<Follow[]>('/v1/users/me/following'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Activity</h1>
        <p className="text-sm text-neutral-400">Everything you&apos;ve marked, ranked, and watched.</p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {CATEGORIES.map((item) => {
          const params = new URLSearchParams();
          if (item.value) params.set('category', item.value);
          const href = params.size ? `/activity?${params}` : '/activity';
          return (
            <Link key={item.value} href={href} className={`rounded-full px-3 py-1 ${(category ?? '') === item.value ? 'bg-brass text-ink' : 'bg-line text-neutral-300 hover:bg-neutral-700'}`}>
              {item.label}
            </Link>
          );
        })}
      </div>

      <ActivityFeed
        ownItems={ownItems}
        initialSocialItems={socialPage.items}
        initialNextCursor={socialPage.next_cursor}
        friends={friends}
        following={following}
        category={category as ActivityItem['category'] | undefined}
      />
    </div>
  );
}
