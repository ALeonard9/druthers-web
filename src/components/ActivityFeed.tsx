'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { activityHref, categoryLabel, describeActivity, groupActivityByDay } from '@/lib/activity';
import type { ActivityItem, Friend, Follow, SocialActivityItem } from '@/lib/types';

const SELECTION_KEY = 'druthers_activity_people';

type PersonOption = {
  id: string;
  label: string;
  relationship: 'Friend' | 'Following';
};

function displayName(user: { display_name: string | null; handle: string | null }): string {
  return user.display_name || user.handle || 'Unnamed user';
}

function dayLabel(day: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
}

export function ActivityFeed({
  ownItems,
  initialSocialItems,
  initialNextCursor,
  friends,
  following,
  category,
}: {
  ownItems: ActivityItem[];
  initialSocialItems: SocialActivityItem[];
  initialNextCursor: string | null;
  friends: Friend[];
  following: Follow[];
  category?: ActivityItem['category'];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [socialItems, setSocialItems] = useState(initialSocialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const people = useMemo(() => {
    const options = new Map<string, PersonOption>();
    for (const friend of friends) {
      options.set(friend.user.id, {
        id: friend.user.id,
        label: displayName(friend.user),
        relationship: 'Friend',
      });
    }
    for (const follow of following) {
      if (!options.has(follow.user.id)) {
        options.set(follow.user.id, {
          id: follow.user.id,
          label: displayName(follow.user),
          relationship: 'Following',
        });
      }
    }
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [friends, following]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(SELECTION_KEY);
    if (!saved) return;
    try {
      const ids: unknown = JSON.parse(saved);
      if (Array.isArray(ids)) {
        const allowed = new Set(people.map((person) => person.id));
        const selected = ids.filter(
          (id): id is string => typeof id === 'string' && allowed.has(id),
        );
        const frame = window.requestAnimationFrame(() => setSelectedIds(selected));
        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      window.sessionStorage.removeItem(SELECTION_KEY);
    }
  }, [people]);

  const items = useMemo(() => {
    const selected = new Set(selectedIds);
    return [
      ...ownItems,
      ...socialItems.filter(
        (item) => selected.has(item.actor.id) && (!category || item.category === category),
      ),
    ].sort(
      (a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at),
    );
  }, [category, ownItems, selectedIds, socialItems]);

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id];
      window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/activity/feed?cursor=${encodeURIComponent(nextCursor)}`);
      if (!response.ok) throw new Error('Could not load more activity.');
      const page = (await response.json()) as { items: SocialActivityItem[]; next_cursor: string | null };
      setSocialItems((current) => [...current, ...page.items]);
      setNextCursor(page.next_cursor);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load more activity.');
    } finally {
      setLoadingMore(false);
    }
  }

  const byDay = groupActivityByDay(items);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="rounded-lg border border-line bg-panel p-3">
        <legend className="px-1 text-sm font-medium text-paper">Include activity from</legend>
        <p className="mb-3 text-xs text-neutral-400">Your activity is always included. Select any friends or people you follow.</p>
        {people.length === 0 ? (
          <p className="text-sm text-neutral-500">Add friends or follow people to include their activity here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <label key={person.id} className="flex cursor-pointer items-center gap-2 rounded-full bg-line px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(person.id)}
                  onChange={() => toggle(person.id)}
                  aria-label={`Include ${person.label}`}
                  className="accent-brass"
                />
                <span>{person.label}</span>
                <span className="text-xs text-neutral-500">{person.relationship}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay.map(({ day, items: dayItems }) => (
            <div key={day} className="rounded-lg border border-line bg-panel">
              <div className="border-b border-line px-3 py-2 text-sm font-medium">{dayLabel(day)}</div>
              <ul>
                {dayItems.map((item, index) => {
                  const socialItem = item as SocialActivityItem;
                  return (
                    <li key={`${item.category}-${item.entity_id}-${item.occurred_at}-${index}`} className="flex items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-b-0">
                      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{categoryLabel(item.category)}</span>
                      <Link href={activityHref(item)} className="flex-1 truncate hover:underline">{item.title}</Link>
                      {'actor' in socialItem && (
                        <span className="shrink-0 text-xs text-neutral-400">{displayName(socialItem.actor)}</span>
                      )}
                      {item.subtitle && <span className="shrink-0 text-xs text-neutral-500">{item.subtitle}</span>}
                      <span className="shrink-0 text-xs text-neutral-400">{describeActivity(item)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div>
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="rounded border border-line px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 disabled:opacity-50">
            {loadingMore ? 'Loading…' : 'Load more activity'}
          </button>
          {loadError && <p className="mt-2 text-sm text-red-400">{loadError}</p>}
        </div>
      )}
    </div>
  );
}
