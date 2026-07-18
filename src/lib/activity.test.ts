import { describe, it, expect } from 'vitest';
import { groupActivityByDay, describeActivity, categoryLabel, activityHref } from './activity';
import type { ActivityItem } from './types';

function item(partial: Partial<ActivityItem> & { entity_id: string }): ActivityItem {
  return {
    category: 'movie',
    action: 'watchlist_added',
    title: 'Inception',
    subtitle: null,
    poster_url: null,
    rank: null,
    occurred_at: '2026-07-16T10:00:00',
    ...partial,
  };
}

describe('groupActivityByDay', () => {
  it('groups items sharing a calendar day, preserving order', () => {
    const items = [
      item({ entity_id: 'a', occurred_at: '2026-07-16T10:00:00' }),
      item({ entity_id: 'b', occurred_at: '2026-07-17T02:00:00' }),
      item({ entity_id: 'c', occurred_at: '2026-07-16T22:00:00' }),
    ];
    const groups = groupActivityByDay(items);
    expect(groups.map((g) => g.day)).toEqual(['2026-07-16', '2026-07-17']);
    expect(groups[0].items.map((i) => i.entity_id)).toEqual(['a', 'c']);
    expect(groups[1].items.map((i) => i.entity_id)).toEqual(['b']);
  });
});

describe('describeActivity', () => {
  it('labels a rank with the position', () => {
    expect(describeActivity(item({ entity_id: 'a', action: 'ranked', rank: 3 }))).toBe(
      'Ranked #3',
    );
  });

  it('uses a per-category verb for marked_done', () => {
    expect(
      describeActivity(item({ entity_id: 'a', category: 'country', action: 'marked_done' })),
    ).toBe('Visited');
    expect(
      describeActivity(item({ entity_id: 'a', category: 'book', action: 'marked_done' })),
    ).toBe('Read');
  });

  it('uses a per-category verb for watchlist_added', () => {
    expect(
      describeActivity(item({ entity_id: 'a', category: 'game', action: 'watchlist_added' })),
    ).toBe('Added to backlog');
  });

  it('labels a watched episode', () => {
    expect(
      describeActivity(item({ entity_id: 'a', category: 'tv_episode', action: 'watched_episode' })),
    ).toBe('Watched');
  });
});

describe('categoryLabel', () => {
  it('returns a readable label per category', () => {
    expect(categoryLabel('tv_show')).toBe('TV Show');
    expect(categoryLabel('tv_episode')).toBe('Episode');
  });
});

describe('activityHref', () => {
  it('links movies, tv shows, and episodes to their pages', () => {
    expect(activityHref(item({ entity_id: 'm1', category: 'movie' }))).toBe('/movies/m1');
    expect(activityHref(item({ entity_id: 's1', category: 'tv_show' }))).toBe('/tv/s1');
    expect(activityHref(item({ entity_id: 's1', category: 'tv_episode' }))).toBe('/tv/s1');
    expect(activityHref(item({ entity_id: 'c1', category: 'country' }))).toBe('/countries/c1');
  });
});
