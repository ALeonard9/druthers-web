import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { describeActivity, categoryLabel, activityHref } from '@/lib/activity';
import type { ActivityItem } from '@/lib/types';

/** Recent activity, streamed in below the Top 5. */

const FEED_LIMIT = 8;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-lg text-paper">Recent activity</h2>
        <Link href="/activity" className="text-xs text-brass hover:text-brass-bright">
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}

export function ActivitySkeleton() {
  return (
    <Frame>
      <p className="animate-pulse px-4 py-6 text-sm text-neutral-600">
        Loading your recent activity…
      </p>
    </Frame>
  );
}

export async function HomeActivity() {
  let activity: ActivityItem[];
  try {
    activity = await apiFetch<ActivityItem[]>(`/v1/users/me/activity?limit=${FEED_LIMIT}`);
  } catch {
    return (
      <Frame>
        <p className="px-4 py-6 text-sm text-neutral-500">
          Couldn&apos;t load your activity.{' '}
          <Link href="/activity" className="text-brass">
            Open it directly
          </Link>
          .
        </p>
      </Frame>
    );
  }

  const feed = activity.slice(0, FEED_LIMIT);

  return (
    <Frame>
      {feed.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Nothing yet — add something to a list and it shows up here.
        </p>
      ) : (
        <ul>
          {feed.map((item, i) => (
            <li
              key={`${item.category}-${item.entity_id}-${i}`}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2 text-sm last:border-b-0"
            >
              <span className="w-16 shrink-0 text-xs uppercase tracking-wide text-neutral-500">
                {categoryLabel(item.category)}
              </span>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <Link
                  href={activityHref(item)}
                  className="min-w-0 truncate hover:underline"
                >
                  {item.title}
                </Link>
                {item.subtitle && (
                  <span className="min-w-0 truncate text-xs text-neutral-500">
                    {item.subtitle}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-neutral-400">
                {describeActivity(item)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}
