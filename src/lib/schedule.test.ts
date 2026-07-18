import { describe, it, expect } from 'vitest';
import { groupByDay, groupByShow } from './schedule';
import type { ScheduleEpisodeItem } from './types';

function item(partial: Partial<ScheduleEpisodeItem> & { episode_id: string }): ScheduleEpisodeItem {
  return {
    show_id: 'show-1',
    show_title: 'Show 1',
    episode_title: 'Episode',
    season: 1,
    season_number: 1,
    airdate: '2026-07-16T00:00:00',
    ...partial,
  };
}

describe('groupByDay', () => {
  it('groups consecutive-or-not items sharing a calendar day', () => {
    const items = [
      item({ episode_id: 'a', airdate: '2026-07-16T10:00:00' }),
      item({ episode_id: 'b', airdate: '2026-07-17T02:00:00' }),
      item({ episode_id: 'c', airdate: '2026-07-16T22:00:00' }),
    ];
    const groups = groupByDay(items);
    expect(groups.map((g) => g.day)).toEqual(['2026-07-16', '2026-07-17']);
    expect(groups[0].items.map((i) => i.episode_id)).toEqual(['a', 'c']);
    expect(groups[1].items.map((i) => i.episode_id)).toEqual(['b']);
  });

  it('buckets missing airdates under "unknown"', () => {
    const groups = groupByDay([item({ episode_id: 'a', airdate: null })]);
    expect(groups).toEqual([{ day: 'unknown', items: [expect.anything()] }]);
  });
});

describe('groupByShow', () => {
  it('groups episodes by show, preserving input order', () => {
    const items = [
      item({ episode_id: 'a', show_id: 's1', show_title: 'Alpha' }),
      item({ episode_id: 'b', show_id: 's2', show_title: 'Beta' }),
      item({ episode_id: 'c', show_id: 's1', show_title: 'Alpha' }),
    ];
    const groups = groupByShow(items);
    expect(groups.map((g) => g.showId)).toEqual(['s1', 's2']);
    expect(groups[0].items.map((i) => i.episode_id)).toEqual(['a', 'c']);
    expect(groups[1].items.map((i) => i.episode_id)).toEqual(['b']);
  });
});
