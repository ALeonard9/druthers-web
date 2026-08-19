import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import type { AdminDomainCounts, AdminUserDetail } from '@/lib/types';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

const DOMAIN_LABELS: Record<keyof AdminUserDetail['domains'], string> = {
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Games',
};

const VISIBILITY_ROWS: [keyof AdminUserDetail['visibility'], string][] = [
  ['profile', 'Profile'],
  ['default_privacy', 'Default'],
  ['movies', 'Movies'],
  ['tv', 'TV'],
  ['books', 'Books'],
  ['games', 'Games'],
  ['watchlist_movies', 'Watchlist - movies'],
  ['watchlist_tv', 'Watchlist - TV'],
  ['watchlist_books', 'Watchlist - books'],
  ['watchlist_games', 'Watchlist - games'],
];

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: AdminUserDetail;
  try {
    user = await apiFetch<AdminUserDetail>(`/v1/admin/users/${encodeURIComponent(id)}`);
  } catch (err) {
    // A refused or missing lookup both read as "not here" to a caller who
    // already passed the route-level admin gate - a 404-shaped id and a
    // 403 on a single-user lookup are equally uninformative to show raw.
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-xs text-neutral-500 hover:text-paper">
          &larr; Directory
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-paper">{user.handle}</h2>
          <span className="rounded bg-line px-1.5 py-0.5 text-[11px] font-medium text-neutral-400">
            {user.status}
          </span>
        </div>
        {user.display_name && (
          <p className="text-sm text-neutral-400">{user.display_name}</p>
        )}
        <p className="text-sm text-neutral-400">{user.email}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Joined{' '}
          <span title={exactTimestamp(user.created_at)}>
            {relativeTimeFrom(user.created_at)}
          </span>
          {' · '}
          Last tracked{' '}
          {user.last_tracked_at ? (
            <span title={exactTimestamp(user.last_tracked_at)}>
              {relativeTimeFrom(user.last_tracked_at)}
            </span>
          ) : (
            'never'
          )}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Shelves</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(DOMAIN_LABELS) as (keyof AdminUserDetail['domains'])[]).map(
            (domain) => (
              <DomainCard
                key={domain}
                label={DOMAIN_LABELS[domain]}
                counts={user.domains[domain]}
              />
            ),
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Visibility</h3>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {VISIBILITY_ROWS.map(([key, label]) => (
                <tr key={key} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-neutral-400">{label}</td>
                  <td className="px-3 py-2 text-paper">
                    {String(user.visibility[key] ?? 'default')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2 text-neutral-400">Share activity</td>
                <td className="px-3 py-2 text-paper">
                  {user.visibility.share_activity ? 'On' : 'Off'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-lg text-paper">Social</h3>
        <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
          <SocialCard label="Friends" value={user.social.friends} />
          <SocialCard label="Followers" value={user.social.followers} />
          <SocialCard label="Following" value={user.social.following} />
        </div>
      </section>
    </div>
  );
}

function DomainCard({ label, counts }: { label: string; counts: AdminDomainCounts }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-display text-xl text-paper">{counts.total}</p>
      <p className="text-[11px] text-neutral-500">
        {counts.ranked} ranked · {counts.watchlist} watchlist
      </p>
    </div>
  );
}

function SocialCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2 text-center">
      <p className="font-display text-xl text-paper">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
