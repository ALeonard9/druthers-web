import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * One shelf's Top 5 - the landing page's primary content, also reused for
 * the public profile clone (#121) with overridden links: a visitor's own
 * `/movies` isn't the right target on someone else's profile.
 *
 * Ranks are printed as stored rather than as row position: the number is the
 * user's actual rank, and a mismatch is a data bug worth seeing rather than
 * papering over (legacy movie ranks were 0-based until the API's
 * backfill_rank_base re-based them).
 */

import { getWatchlistLabels } from '@/lib/domainLabels';

interface Top5BoardEntry {
  // Absent on a public profile's entries - those never expose an id to link
  // through to (#274 strips it), so the row renders unlinked there.
  id?: string;
  rank: number;
  title: string;
  year?: number | null;
}

interface Top5BoardShelf {
  category: string;
  label: string;
  ranked_count: number;
  queued_count?: number;
  top: Top5BoardEntry[];
}

const HREF: Record<string, string> = {
  movies: '/movies',
  tv: '/tv',
  books: '/books',
  games: '/games',
};

export function Top5Board({
  shelf,
  href,
  watchlistHref,
  emptyMessage,
}: {
  shelf: Top5BoardShelf;
  // Overrides the owner's-own-shelf default - required off the profile page.
  href?: string;
  watchlistHref?: string;
  emptyMessage?: ReactNode;
}) {
  const resolvedHref = href ?? HREF[shelf.category] ?? '#';
  const watchlistLabel = getWatchlistLabels(shelf.category).singular;

  return (
    <section className="flex flex-col rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <Link
          href={resolvedHref}
          className="font-display text-lg text-paper hover:text-brass"
        >
          {shelf.label}
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
            {shelf.ranked_count} ranked
            {!!shelf.queued_count && ` · ${shelf.queued_count} queued`}
          </span>
          {watchlistHref && (
            <Link
              href={watchlistHref}
              className="font-mono text-[11px] uppercase tracking-wide text-brass hover:text-brass-bright"
            >
              {watchlistLabel} →
            </Link>
          )}
        </div>
      </div>


      {shelf.top.length === 0 ? (
        <p className="flex-1 px-4 py-6 text-sm text-neutral-500">
          {emptyMessage ?? (
            <>
              Nothing ranked yet -{' '}
              <Link href={resolvedHref} className="text-brass hover:text-brass-bright">
                start your list
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ol className="flex-1">
          {shelf.top.map((entry) => (
            <li
              key={entry.id ?? entry.rank}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2 text-sm last:border-b-0"
            >
              <span className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded bg-brass-wash font-display text-sm text-brass">
                {entry.rank}
              </span>
              {entry.id ? (
                <Link
                  href={`${resolvedHref}/${entry.id}`}
                  className="flex-1 truncate text-neutral-200 hover:underline"
                >
                  {entry.title}
                </Link>
              ) : (
                <span className="flex-1 truncate text-neutral-200">{entry.title}</span>
              )}
              {entry.year && (
                <span className="shrink-0 font-mono text-xs text-neutral-500">
                  {entry.year}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
