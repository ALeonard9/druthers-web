import Link from 'next/link';
import { getWatchlistLabels, type MediaDomain } from '@/lib/domainLabels';
import type { SocialItemContext, VisibilityTier } from '@/lib/types';

export function NotesVisibilityDisclaimer({ tier }: { tier: VisibilityTier }) {
  return (
    <p className="mt-1 text-xs text-neutral-500">
      Visible to: {tier}.{' '}
      <Link href="/settings#sharing" className="text-brass hover:text-brass-bright">
        Change visibility
      </Link>
    </p>
  );
}

export function SocialContext({
  domain,
  people,
}: {
  domain: MediaDomain;
  people: SocialItemContext[];
}) {
  const watchlistLabel = getWatchlistLabels(domain).on_badge;

  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="social-context-heading">
      <h2 id="social-context-heading" className="font-display text-lg text-paper">
        From your circle
      </h2>
      {people.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          No friends or people you follow are tracking this yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {people.map((person) => (
            <li key={person.handle} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-medium text-neutral-100">
                  {person.display_name ?? person.handle}
                </span>
                <span className="text-xs text-neutral-500">
                  {person.relationship === 'friends' ? 'Friend' : 'Following'}
                </span>
                {person.rank !== null && (
                  <span className="text-sm text-neutral-300">Ranked #{person.rank}</span>
                )}
                {person.on_watchlist && (
                  <span className="text-sm text-neutral-300">{watchlistLabel}</span>
                )}
              </div>
              {person.notes === null ? (
                <p className="mt-1 text-sm italic text-neutral-500">Notes are not visible to you.</p>
              ) : person.notes ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">{person.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
