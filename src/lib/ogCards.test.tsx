import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OgShareCard, profileOgData } from './ogCards';
import type { PublicProfile } from './types';

const profile: PublicProfile = {
  handle: 'avery',
  display_name: 'Avery',
  total_ranked: 1,
  viewer: { relationship: 'anonymous', following: false },
  shelves: [
    {
      category: 'TV',
      slug: 'tv',
      ranked_count: 1,
      items: [{ id: '1', rank: 1, title: 'Severance', year: 2022, poster_url: null }],
      watchlist_count: 1,
      watchlist: [{ id: '2', title: 'The Bear', year: 2022, poster_url: null }],
    },
  ],
};

describe('OG card data (web#124)', () => {
  it('uses real public shelf content and its canonical path', () => {
    const data = profileOgData(profile, profile.shelves[0]);
    expect(data.items[0]).toMatchObject({ rank: 1, title: 'Severance' });
    expect(data.footer).toBe('druthers.io/u/avery/tv');
  });

  it('builds a watchlist card without leaking another shelf', () => {
    const data = profileOgData(profile, profile.shelves[0], 'watchlist');
    expect(data.items.map((item) => item.title)).toEqual(['The Bear']);
    expect(data.footer).toBe('druthers.io/u/avery/tv/watchlist');
  });

  it('renders a text fallback when a poster is unavailable', () => {
    const html = renderToStaticMarkup(<OgShareCard data={profileOgData(profile)} />);
    expect(html).toContain('Severance');
    expect(html).toContain('druthers.io/u/avery');
  });
});
