'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  const [relationshipFilter, setRelationshipFilter] = useState<'all' | SocialItemContext['relationship']>('all');
  const watchlistLabel = getWatchlistLabels(domain).on_badge;
  const hasFriends = people.some((person) => person.relationship === 'friends');
  const hasFollows = people.some((person) => person.relationship === 'follows');
  const showFilter = hasFriends && hasFollows;
  const visiblePeople = relationshipFilter === 'all'
    ? people
    : people.filter((person) => person.relationship === relationshipFilter);

  const emptyFilterMessage = relationshipFilter === 'friends'
    ? 'No friends are tracking this yet.'
    : 'No people you follow are tracking this yet.';

  return (
    <section className="rounded-lg border border-line bg-panel p-4" aria-labelledby="social-context-heading">
      <h2 id="social-context-heading" className="font-display text-lg text-paper">
        From your circle
      </h2>
      {showFilter && (
        <div className="mt-3 flex gap-2" aria-label="Filter people by relationship">
          {([
            ['all', 'All'],
            ['friends', 'Friends'],
            ['follows', 'Following'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRelationshipFilter(value)}
              aria-pressed={relationshipFilter === value}
              className={`rounded px-2 py-1 text-xs font-medium ${
                relationshipFilter === value
                  ? 'bg-brass text-ink'
                  : 'bg-line text-neutral-300 hover:text-paper'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {people.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">
          No friends or people you follow are tracking this yet.
        </p>
      ) : visiblePeople.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-400">{emptyFilterMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {visiblePeople.map((person) => (
            <li key={person.handle} className="border-t border-line pt-3 first:border-t-0 first:pt-0 hover:text-paper">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link href={`/u/${person.handle}`} className="font-medium text-neutral-100 hover:text-brass-bright">
                  {person.display_name ?? person.handle}
                </Link>
                <span className="text-xs text-neutral-500">
                  {person.relationship === 'friends' ? 'Friend' : 'Following'}
                </span>
                {person.rank !== null && (
                  <Link
                    href={`/u/${person.handle}/${domain}`}
                    className="text-sm text-neutral-300 hover:text-brass-bright"
                  >
                    Ranked #{person.rank}
                  </Link>
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
