import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { groupByDay, groupByShow } from '@/lib/schedule';
import type { Schedule } from '@/lib/types';
import { ScheduleEpisodeRow } from '@/components/ScheduleEpisodeRow';
import { FrozenShowsList } from '@/components/FrozenShowsList';
import { SectionTabs } from '@/components/SectionTabs';
import { TV_TABS } from '@/lib/sectionTabs';
import { relativeDayLabel } from '@/lib/viewerTime';
import { getViewerTimeZone } from '@/lib/viewerTimeZone';

export const dynamic = 'force-dynamic';

// Pinned to UTC on purpose, and it must stay that way: an airdate is a bare
// calendar date the broadcaster published, not an instant. Rendering
// `2026-08-15T00:00:00Z` in the reader's zone would move it to the 14th for
// anyone west of Greenwich. What *does* follow the reader is which days the
// API puts in the window, and which of them is "today" - both below.
const DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

function dayLabel(day: string, now: Date, timeZone: string): string {
  if (day === 'unknown') return 'Unknown date';
  const absolute = DAY_LABEL.format(new Date(`${day}T00:00:00Z`));
  const relative = relativeDayLabel(day, now, timeZone);
  return relative ? `${relative} - ${absolute}` : absolute;
}

export default async function SchedulePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let schedule: Schedule;
  try {
    schedule = await apiFetch<Schedule>('/v1/users/me/schedule');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const timeZone = await getViewerTimeZone();
  const now = new Date();

  const upcomingByDay = groupByDay(schedule.upcoming);
  const catchUpByShow = groupByShow(schedule.catch_up);

  return (
    <div className="flex flex-col gap-8">
      <SectionTabs tabs={TV_TABS} />
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Schedule</h1>
        <p className="text-sm text-neutral-400">
          What&apos;s airing soon, and what you&apos;re behind on.
        </p>
      </div>

      {schedule.catch_up.length === 0 && schedule.upcoming.length === 0 ? (
        <p className="text-lg text-neutral-300">You are all caught up!</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <section>
            <h2 className="mb-1 text-lg font-medium text-neutral-200">
              <Link href="/tv" className="hover:underline">
                What to watch
              </Link>
            </h2>
            <p className="mb-4 text-xs text-neutral-500">
              Unwatched episodes airing within 5 days of today.
            </p>
            {upcomingByDay.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing airing soon.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingByDay.map(({ day, items }) => (
                  <details
                    key={day}
                    open
                    className="group rounded-lg border border-line bg-panel"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      {dayLabel(day, now, timeZone)}
                      <span className="text-xs font-normal text-neutral-500">
                        {items.length} episode{items.length === 1 ? '' : 's'}{' '}
                        <span className="inline-block transition-transform group-open:rotate-90">
                          ▸
                        </span>
                      </span>
                    </summary>
                    <ul className="border-t border-line">
                      {items.map((item) => (
                        <ScheduleEpisodeRow
                          key={item.episode_id}
                          item={item}
                          showTitle
                        />
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-1 text-lg font-medium text-neutral-200">
              All unwatched:{' '}
              <span className="text-neutral-400">{schedule.catch_up.length}</span>
            </h2>
            <p className="mb-4 text-xs text-neutral-500">
              Everything overdue, grouped by show - how far behind you are.
            </p>
            {catchUpByShow.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing overdue.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {catchUpByShow.map(({ showId, showTitle, items }) => (
                  <details
                    key={showId}
                    className="group rounded-lg border border-line bg-panel"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      <Link href={`/tv/${showId}`} className="hover:underline">
                        {showTitle}
                      </Link>
                      <span className="text-xs font-normal text-neutral-500">
                        {items.length} behind{' '}
                        <span className="inline-block transition-transform group-open:rotate-90">
                          ▸
                        </span>
                      </span>
                    </summary>
                    <ul className="border-t border-line">
                      {items.map((item) => (
                        <ScheduleEpisodeRow key={item.episode_id} item={item} />
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <FrozenShowsList shows={schedule.frozen_shows} />
    </div>
  );
}
