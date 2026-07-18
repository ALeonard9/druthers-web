import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import {
  groupActivityByDay,
  describeActivity,
  categoryLabel,
  activityHref,
} from '@/lib/activity';
import type { ActivityItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

function dayLabel(day: string): string {
  return DAY_LABEL.format(new Date(`${day}T00:00:00Z`));
}

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
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';

  let items: ActivityItem[];
  try {
    items = await apiFetch<ActivityItem[]>(`/v1/users/me/activity${qs}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const byDay = groupActivityByDay(items);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Activity</h1>
        <p className="text-sm text-neutral-400">
          Everything you&apos;ve marked, ranked, and watched.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={c.value ? `/activity?category=${c.value}` : '/activity'}
            className={`rounded-full px-3 py-1 ${
              (category ?? '') === c.value
                ? 'bg-brass text-ink'
                : 'bg-line text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay.map(({ day, items: dayItems }) => (
            <div
              key={day}
              className="rounded-lg border border-line bg-panel"
            >
              <div className="border-b border-line px-3 py-2 text-sm font-medium">
                {dayLabel(day)}
              </div>
              <ul>
                {dayItems.map((item, i) => (
                  <li
                    key={`${item.category}-${item.entity_id}-${i}`}
                    className="flex items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-b-0"
                  >
                    <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-neutral-500">
                      {categoryLabel(item.category)}
                    </span>
                    <Link
                      href={activityHref(item)}
                      className="flex-1 truncate hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.subtitle && (
                      <span className="shrink-0 text-xs text-neutral-500">
                        {item.subtitle}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-neutral-400">
                      {describeActivity(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
