import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { activityHref, describeActivity } from '@/lib/activity';
import type { SocialActivityItem, SocialActivityPage } from '@/lib/types';

const PREVIEW_LIMIT = 3;

function actorName(item: SocialActivityItem) {
  return item.actor.display_name || item.actor.handle || 'A friend';
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="font-display text-lg text-paper">Friends activity</h2>
          <p className="text-xs text-neutral-500">Latest updates from people you know</p>
        </div>
        <Link href="/activity" className="text-xs text-brass hover:text-brass-bright">
          See all activity
        </Link>
      </div>
      {children}
    </section>
  );
}

export function FriendsActivitySkeleton() {
  return (
    <Frame>
      <p className="animate-pulse px-4 py-5 text-sm text-neutral-600">
        Loading friend activity…
      </p>
    </Frame>
  );
}

/** A compact, visibility-filtered preview; the full feed belongs on /activity. */
export async function HomeFriendsActivity() {
  let page: SocialActivityPage;
  try {
    page = await apiFetch<SocialActivityPage>(`/v1/users/me/feed?limit=${PREVIEW_LIMIT}`);
  } catch {
    return (
      <Frame>
        <p className="px-4 py-5 text-sm text-neutral-500">
          Couldn&apos;t load friend activity.{' '}
          <Link href="/activity" className="text-brass hover:text-brass-bright">
            Open activity
          </Link>
          .
        </p>
      </Frame>
    );
  }

  const items = page.items.slice(0, PREVIEW_LIMIT);
  return (
    <Frame>
      {items.length === 0 ? (
        <p className="px-4 py-5 text-sm text-neutral-500">
          No friend activity yet - add friends to see what they&apos;re ranking.{' '}
          <Link href="/friends" className="text-brass hover:text-brass-bright">
            Add friends
          </Link>
          .
        </p>
      ) : (
        <ul aria-label="Latest friend activity">
          {items.map((item, index) => (
            <li
              key={`${item.actor.id}-${item.category}-${item.entity_id}-${item.occurred_at}-${index}`}
              className="flex items-baseline gap-2 border-b border-line/60 px-4 py-2.5 text-sm last:border-b-0"
            >
              <span className="shrink-0 font-medium text-paper">{actorName(item)}</span>
              <span className="min-w-0 flex-1 truncate text-neutral-400">
                {describeActivity(item)}
                {' · '}
                <Link href={activityHref(item)} className="text-neutral-200 hover:underline">
                  {item.title}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}
