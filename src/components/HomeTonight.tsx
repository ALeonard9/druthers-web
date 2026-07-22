import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Schedule } from '@/lib/types';

/**
 * "Tonight" — streamed below the Top 5 rather than blocking first paint.
 * The schedule query is bounded API-side, but it's still the slowest thing
 * on the page, and nothing above it needs to wait.
 */

const AIRDATE_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

// Per-request server component — "now" is stable for the render.
function airingSoon(schedule: Schedule) {
  const cutoff = Date.now() - 86_400_000;
  return schedule.upcoming
    .filter((e) => e.airdate && Date.parse(e.airdate) >= cutoff)
    .slice(0, 5);
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-lg text-paper">Tonight</h2>
        <Link href="/tv/schedule" className="text-xs text-brass hover:text-brass-bright">
          Full schedule
        </Link>
      </div>
      {children}
    </section>
  );
}

export function TonightSkeleton() {
  return (
    <Frame>
      <p className="animate-pulse px-4 py-6 text-sm text-neutral-600">
        Checking what&apos;s airing…
      </p>
    </Frame>
  );
}

export async function HomeTonight() {
  let schedule: Schedule;
  try {
    schedule = await apiFetch<Schedule>('/v1/users/me/schedule');
  } catch {
    // The Top 5 above is the page; a schedule blip shouldn't take it down.
    return (
      <Frame>
        <p className="px-4 py-6 text-sm text-neutral-500">
          Couldn&apos;t load the schedule.{' '}
          <Link href="/tv/schedule" className="text-brass">
            Open it directly
          </Link>
          .
        </p>
      </Frame>
    );
  }

  const airing = airingSoon(schedule);
  const behind = schedule.catch_up.length;

  return (
    <Frame>
      {airing.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          Nothing airing in the next few days
          {behind > 0 && (
            <>
              {' '}
              — but you&apos;re {behind} episode{behind === 1 ? '' : 's'} behind.{' '}
              <Link href="/tv/schedule" className="text-brass">
                Catch up
              </Link>
            </>
          )}
          .
        </p>
      ) : (
        <ul>
          {airing.map((e) => (
            <li
              key={e.episode_id}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2 text-sm last:border-b-0"
            >
              <span className="w-10 shrink-0 font-mono text-xs uppercase text-neutral-500">
                {e.airdate ? AIRDATE_LABEL.format(new Date(e.airdate)) : '—'}
              </span>
              <Link href={`/tv/${e.show_id}`} className="truncate hover:underline">
                {e.show_title}
              </Link>
              <span className="shrink-0 text-xs text-neutral-500">
                {e.season}.{e.season_number} {e.episode_title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}
