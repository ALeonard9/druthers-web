import Link from 'next/link';
import type { SummaryShelf } from '@/lib/types';

/**
 * One shelf's Top 5 — the landing page's primary content.
 *
 * Ranks are printed as stored rather than as row position: the number is the
 * user's actual rank, and a mismatch is a data bug worth seeing rather than
 * papering over (legacy movie ranks were 0-based until the API's
 * backfill_rank_base re-based them).
 */

const HREF: Record<SummaryShelf['category'], string> = {
  movies: '/movies',
  tv: '/tv',
  books: '/books',
  games: '/games',
};

export function Top5Board({ shelf }: { shelf: SummaryShelf }) {
  const href = HREF[shelf.category];

  return (
    <section className="flex flex-col rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <Link href={href} className="font-display text-lg text-paper hover:text-brass">
          {shelf.label}
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
          {shelf.ranked_count} ranked
          {shelf.queued_count > 0 && ` · ${shelf.queued_count} queued`}
        </span>
      </div>

      {shelf.top.length === 0 ? (
        <p className="flex-1 px-4 py-6 text-sm text-neutral-500">
          Nothing ranked yet —{' '}
          <Link href={href} className="text-brass hover:text-brass-bright">
            start your list
          </Link>
          .
        </p>
      ) : (
        <ol className="flex-1">
          {shelf.top.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 border-b border-line/60 px-4 py-2 text-sm last:border-b-0"
            >
              <span className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded bg-brass-wash font-display text-sm text-brass">
                {entry.rank}
              </span>
              <Link
                href={`${href}/${entry.id}`}
                className="flex-1 truncate text-neutral-200 hover:underline"
              >
                {entry.title}
              </Link>
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
