'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { activityHref, categoryLabel, describeActivity, groupActivityByDay, profileHref } from '@/lib/activity';
import type { ActivityItem, Friend, Follow, SocialActivityItem } from '@/lib/types';

const SELECTION_KEY = 'druthers_activity_people';

type PersonOption = {
  id: string;
  label: string;
  relationship: 'friend' | 'following';
};

type PersonGroup = 'friends' | 'following';

// The selector and the rows it selects carry the SAME fill, so the control at
// the top and the rows below read as one system. The shared -wash tokens are
// not used here: they are shared with the status badges, comparison view and
// sound picker, and lifting them for this feature would lift them everywhere.
// A percentage of the base colour lifts only these surfaces.
const GROUP_STYLE: Record<PersonGroup, { label: string; chip: string; row: string }> = {
  friends: {
    label: 'Friends',
    chip: 'border-moss/50 bg-moss/20 text-moss-bright',
    row: 'bg-moss/20',
  },
  following: {
    label: 'Follows',
    chip: 'border-ember/50 bg-ember/20 text-ember-bright',
    row: 'bg-ember/20',
  },
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

function RelationshipIcon({ relationship }: { relationship: PersonOption['relationship'] }) {
  const label = relationship === 'friend' ? 'Friend' : 'Follow';
  return (
    <span role="img" aria-label={label} className="inline-flex shrink-0 text-current">
      {relationship === 'friend' ? '👥' : '🔔'}
    </span>
  );
}

function GroupCheckbox({
  label,
  checked,
  indeterminate,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={`Include ${label}`}
      className="h-4 w-4 shrink-0 accent-brass disabled:cursor-default disabled:opacity-100"
    />
  );
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
  // You is on by default but removable: "I just want to see what my friends are
  // up to" is a real question, and pinning yourself in makes it unanswerable.
  const [includeSelf, setIncludeSelf] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Partial<Record<PersonGroup, boolean>>>({});
  const [query, setQuery] = useState('');
  const [socialItems, setSocialItems] = useState(initialSocialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const peopleByGroup = useMemo(() => {
    const friendsById = new Map<string, PersonOption>();
    for (const friend of friends) {
      friendsById.set(friend.user.id, {
        id: friend.user.id,
        label: displayName(friend.user),
        relationship: 'friend',
      });
    }
    const followsById = new Map<string, PersonOption>();
    for (const follow of following) {
      if (!friendsById.has(follow.user.id)) {
        followsById.set(follow.user.id, {
          id: follow.user.id,
          label: displayName(follow.user),
          relationship: 'following',
        });
      }
    }
    return {
      friends: [...friendsById.values()].sort((a, b) => a.label.localeCompare(b.label)),
      following: [...followsById.values()].sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [friends, following]);

  const people = useMemo(
    () => [...peopleByGroup.friends, ...peopleByGroup.following],
    [peopleByGroup],
  );

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
      ...(includeSelf ? ownItems : []),
      ...socialItems.filter(
        (item) => selected.has(item.actor.id) && (!category || item.category === category),
      ),
    ].sort(
      (a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at),
    );
  }, [category, includeSelf, ownItems, selectedIds, socialItems]);

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id];
      window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify(next));
      return next;
    });
  }

  function toggleGroup(group: PersonGroup) {
    const ids = peopleByGroup[group].map((person) => person.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => {
      const next = allSelected
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])];
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
      <div className="relative">
        <button
          type="button"
          aria-expanded={filterOpen}
          aria-controls="activity-people-filter"
          onClick={() => setFilterOpen((open) => !open)}
          className="flex min-h-10 w-full items-center justify-between rounded-lg border border-line bg-panel px-3 text-left text-sm text-paper hover:border-neutral-600 sm:w-80"
        >
          <span>Include activity from</span>
          <span className="text-xs text-neutral-400">
            {includeSelf
              ? `You + ${selectedIds.length} selected ▾`
              : selectedIds.length === 0
                ? 'Nobody selected ▾'
                : `${selectedIds.length} selected ▾`}
          </span>
        </button>
        {filterOpen && (
          <div id="activity-people-filter" className="absolute z-10 mt-2 w-full max-w-md rounded-lg border border-line bg-panel p-3 shadow-xl sm:w-96">
            <label className="block text-xs font-medium text-neutral-300" htmlFor="activity-people-search">Search people</label>
            <input
              id="activity-people-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search friends and follows"
              className="mt-1 w-full rounded border border-line bg-night px-3 py-2 text-sm text-paper placeholder:text-neutral-500"
            />
            <div className="mt-3 max-h-80 overflow-y-auto">
              <div className="flex items-center gap-2 rounded px-2 py-2 text-sm text-paper">
                <GroupCheckbox
                  label="You"
                  checked={includeSelf}
                  indeterminate={false}
                  onChange={() => setIncludeSelf((current) => !current)}
                />
                <span className="font-medium">You</span>
              </div>
              {(['friends', 'following'] as const).map((group) => {
                const groupPeople = peopleByGroup[group];
                const matchingPeople = groupPeople.filter((person) => person.label.toLowerCase().includes(query.trim().toLowerCase()));
                const selectedCount = groupPeople.filter((person) => selectedIds.includes(person.id)).length;
                const allSelected = groupPeople.length > 0 && selectedCount === groupPeople.length;
                const isExpanded = expandedGroups[group] || query.trim().length > 0;
                const style = GROUP_STYLE[group];
                return (
                  <div key={group} className="border-t border-line/70 py-1">
                    <div className={`flex items-center gap-2 rounded px-2 py-2 ${style.chip}`}>
                      <GroupCheckbox label={style.label} checked={allSelected} indeterminate={selectedCount > 0 && !allSelected} onChange={() => toggleGroup(group)} />
                      <button type="button" onClick={() => setExpandedGroups((current) => ({ ...current, [group]: !current[group] }))} className="flex flex-1 items-center justify-between text-left font-medium">
                        <span>{style.label}</span>
                        <span className="text-xs">{selectedCount}/{groupPeople.length} {isExpanded ? '⌃' : '⌄'}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-3 border-l border-line pl-2">
                        {matchingPeople.map((person) => (
                          <label key={person.id} className={`mt-1 flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm ${style.row} text-paper`}>
                            <input type="checkbox" checked={selectedIds.includes(person.id)} onChange={() => toggle(person.id)} aria-label={`Include ${person.label}`} className="h-4 w-4 accent-brass" />
                            <RelationshipIcon relationship={person.relationship} />
                            <span className="truncate">{person.label}</span>
                            <span aria-hidden="true" className="ml-auto text-xs">{selectedIds.includes(person.id) ? '✓' : ''}</span>
                          </label>
                        ))}
                        {matchingPeople.length === 0 && <p className="px-2 py-2 text-sm text-neutral-500">No matching {style.label.toLowerCase()}.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {people.length === 0 && <p className="mt-3 text-sm text-neutral-500">Add friends or follow people to include their activity here.</p>}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {!includeSelf && selectedIds.length === 0
            ? 'Nobody selected - pick yourself or someone you follow above.'
            : 'Nothing here yet.'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay.map(({ day, items: dayItems }) => (
            <div key={day} className="rounded-lg border border-line bg-panel">
              <div className="border-b border-line px-3 py-2 text-sm font-medium">{dayLabel(day)}</div>
              <ul>
                {dayItems.map((item, index) => {
                  const socialItem = item as SocialActivityItem;
                  const person = 'actor' in socialItem
                    ? people.find((option) => option.id === socialItem.actor.id)
                    : null;
                  const group = person?.relationship === 'friend' ? 'friends' : 'following';
                  const actorLink = 'actor' in socialItem ? profileHref(socialItem.actor) : null;
                  return (
                    <li key={`${item.category}-${item.entity_id}-${item.occurred_at}-${index}`} className={`flex items-center gap-3 border-b border-line/60 px-3 py-2 text-sm last:border-b-0 ${'actor' in socialItem ? GROUP_STYLE[group].row : 'bg-brass-wash/30'}`}>
                      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-neutral-500">{categoryLabel(item.category)}</span>
                      <Link href={activityHref(item)} className="flex-1 truncate hover:underline">{item.title}</Link>
                      {'actor' in socialItem ? (
                        <span className="flex shrink-0 items-center gap-1 font-medium text-paper">
                          <RelationshipIcon relationship={person?.relationship ?? 'following'} />
                          {actorLink ? (
                            <Link href={actorLink} className="hover:underline">
                              {displayName(socialItem.actor)}
                            </Link>
                          ) : (
                            displayName(socialItem.actor)
                          )}
                        </span>
                      ) : <span className="shrink-0 font-medium text-brass">You</span>}
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
