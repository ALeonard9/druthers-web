import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { describeActivity, categoryLabel, activityHref } from '@/lib/activity';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import type {
  ActivityItem,
  Schedule,
  UserBook,
  UserMovie,
  UserTVShow,
  UserVideoGame,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const AIRDATE_LABEL = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

function counts(list: { on_watchlist: boolean; on_rankings: boolean }[]) {
  return {
    ranked: list.filter((i) => i.on_rankings).length,
    queued: list.filter((i) => i.on_watchlist).length,
  };
}

// Per-request server component — "now" is stable for the render.
function airingSoon(schedule: Schedule) {
  const cutoff = Date.now() - 86_400_000;
  return schedule.upcoming
    .filter((e) => e.airdate && Date.parse(e.airdate) >= cutoff)
    .slice(0, 5);
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let schedule: Schedule;
  let activity: ActivityItem[];
  let movies: UserMovie[];
  let shows: UserTVShow[];
  let books: UserBook[];
  let games: UserVideoGame[];
  try {
    [schedule, activity, movies, shows, books, games] = await Promise.all([
      apiFetch<Schedule>('/v1/users/me/schedule'),
      apiFetch<ActivityItem[]>('/v1/users/me/activity?limit=25'),
      apiFetch<UserMovie[]>('/v1/users/me/movies'),
      apiFetch<UserTVShow[]>('/v1/users/me/tv-shows'),
      apiFetch<UserBook[]>('/v1/users/me/books'),
      apiFetch<UserVideoGame[]>('/v1/users/me/games'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const airing = airingSoon(schedule);
  const behind = schedule.catch_up.length;
  const shareData = buildShareData({
    email: user.email,
    movies,
    shows,
    books,
    games,
  });
  // Countries was cut from the product — keep old entries out of the feed.
  const feed = activity.filter((a) => a.category !== 'country').slice(0, 8);

  const shelf = [
    { label: 'Movies', href: '/movies', ...counts(movies) },
    { label: 'TV', href: '/tv', ...counts(shows) },
    { label: 'Books', href: '/books', ...counts(books) },
    { label: 'Games', href: '/games', ...counts(games) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-panel lg:col-span-2">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-lg text-paper">Tonight</h2>
            <Link
              href="/tv/schedule"
              className="text-xs text-brass hover:text-brass-bright"
            >
              Full schedule
            </Link>
          </div>
          {airing.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">
              Nothing airing in the next few days
              {behind > 0 && (
                <>
                  {' '}
                  — but you&apos;re {behind} episode{behind === 1 ? '' : 's'}{' '}
                  behind.{' '}
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
                    {e.airdate
                      ? AIRDATE_LABEL.format(new Date(e.airdate))
                      : '—'}
                  </span>
                  <Link
                    href={`/tv/${e.show_id}`}
                    className="truncate hover:underline"
                  >
                    {e.show_title}
                  </Link>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {e.season}.{e.season_number} {e.episode_title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/surprise"
          className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-panel p-6 hover:border-brass"
        >
          <span className="font-display text-6xl leading-none text-brass transition-transform group-hover:-rotate-12">
            ’
          </span>
          <span className="font-display text-lg text-paper">Surprise me</span>
          <span className="text-center text-xs text-neutral-500">
            One thing off your lists, picked at random.
          </span>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-paper">Your shelves</h2>
          <ShareTop5Button data={shareData} />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {shelf.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-line bg-panel p-4 hover:border-brass"
            >
              <div className="text-sm text-neutral-400">{s.label}</div>
              <div className="mt-1 font-display text-2xl text-paper">
                {s.ranked}
                <span className="text-sm text-neutral-500"> ranked</span>
              </div>
              <div className="text-xs text-neutral-500">
                {s.queued} on your list
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-lg text-paper">Recent activity</h2>
          <Link
            href="/activity"
            className="text-xs text-brass hover:text-brass-bright"
          >
            See all
          </Link>
        </div>
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
                <Link
                  href={activityHref(item)}
                  className="flex-1 truncate hover:underline"
                >
                  {item.title}
                </Link>
                <span className="shrink-0 text-xs text-neutral-400">
                  {describeActivity(item)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
