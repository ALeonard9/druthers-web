import { describe, it, expect } from 'vitest';
import { statusTooltip, STATUS_LABELS } from './showStatus';
import type { UserTVShow } from './types';

function show(partial: Partial<UserTVShow>): UserTVShow {
  return {
    id: 'u1',
    on_watchlist: true,
    on_rankings: false,
    rank: null,
    notes: null,
    completed_at: null,
    status: null,
    freeze: 0,
    tv_show: {
      id: 's1',
      title: 'Severance',
      imdb: null,
      tvmaze: null,
      status: null,
      poster_url: null,
      year: null,
      genre: null,
      network: null,
      runtime: null,
      rating: null,
    },
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('statusTooltip', () => {
  it('describes behind with counts', () => {
    const s = show({ watch_status: 'behind', aired_count: 16, watched_count: 3 });
    expect(statusTooltip(s)).toBe('Behind — 3 of 16 aired episodes watched');
  });

  it('describes complete and up to date', () => {
    expect(
      statusTooltip(show({ watch_status: 'complete', aired_count: 62, watched_count: 62 })),
    ).toContain('all 62 episodes');
    expect(
      statusTooltip(show({ watch_status: 'up_to_date', aired_count: 9, watched_count: 9 })),
    ).toContain('all 9 aired');
  });

  it('defaults to not started when the API omits status', () => {
    expect(statusTooltip(show({}))).toContain('Not started');
  });
});

describe('STATUS_LABELS', () => {
  it('covers every status', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([
      'behind',
      'complete',
      'not_started',
      'up_to_date',
    ]);
  });
});
