import { describe, expect, it } from 'vitest';
import {
  buildShareData,
  profileUrl,
  SITE_URL,
  type ShareCategory,
} from './shareCards';
import type { Summary, SummaryShelf } from './types';

function shelf(
  category: SummaryShelf['category'],
  titles: string[],
  extra: Partial<SummaryShelf> = {},
): SummaryShelf {
  return {
    category,
    label: category,
    ranked_count: titles.length,
    queued_count: 0,
    public: false,
    top: titles.map((title, i) => ({
      rank: i + 1,
      id: title,
      title,
      year: 2000 + i,
      poster_url: null,
    })),
    ...extra,
  };
}

function summary(over: Partial<Summary> = {}): Summary {
  return {
    handle: null,
    display_name: 'Adam',
    profile_public: false,
    shelves: [shelf('movies', ['First', 'Second'])],
    total_ranked: 2,
    ...over,
  };
}

describe('profileUrl', () => {
  it('uses the /u/ path the web actually serves', () => {
    expect(profileUrl('avery')).toBe('https://www.druthers.io/u/avery');
  });
});

describe('buildShareData', () => {
  it('carries the entries through in rank order', () => {
    const data = buildShareData(summary());
    expect(data.shelves).toHaveLength(1);
    expect(data.shelves[0].top.map((e) => e.title)).toEqual([
      'First',
      'Second',
    ]);
    expect(data.shelves[0].rankedCount).toBe(2);
  });

  it('labels games as Video Games', () => {
    const data = buildShareData(
      summary({ shelves: [shelf('games', ['G'])], total_ranked: 1 }),
    );
    expect(data.shelves.map((s) => s.label)).toEqual(['Video Games']);
  });

  it('drops shelves with nothing ranked but still totals them', () => {
    const data = buildShareData(
      summary({
        shelves: [shelf('movies', ['Only']), shelf('tv', [])],
        total_ranked: 1,
      }),
    );
    expect(data.shelves.map((s) => s.category)).toEqual<ShareCategory[]>([
      'movies',
    ]);
    expect(data.totalRanked).toBe(1);
  });

  // The share-card 404: cards used to print druthers.io/<email-local-part>,
  // which is neither the real handle nor a route that exists.
  it('links to the profile only when it actually resolves', () => {
    const data = buildShareData(
      summary({ handle: 'avery', profile_public: true }),
    );
    expect(data.url).toBe('https://www.druthers.io/u/avery');
    expect(data.profilePublic).toBe(true);
    expect(data.handle).toBe('avery');
  });

  it('falls back to the site when no handle is claimed', () => {
    const data = buildShareData(summary({ handle: null }));
    expect(data.url).toBe(SITE_URL);
    expect(data.profilePublic).toBe(false);
  });

  it('falls back to the site when the profile is private', () => {
    // A handle exists, but no shelf is opted in — /v1/public/<handle> 404s.
    const data = buildShareData(
      summary({ handle: 'avery', profile_public: false }),
    );
    expect(data.url).toBe(SITE_URL);
    expect(data.profilePublic).toBe(false);
  });
});
