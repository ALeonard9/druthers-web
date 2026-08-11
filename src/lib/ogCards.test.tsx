import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { embedPosters, genericOgData, OgShareCard, profileOgData } from './ogCards';
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

describe('OG card data (web#124, web#200)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds a profile card with the owner and representative content', () => {
    const data = profileOgData(profile);
    expect(data.title).toBe('Avery’s druthers');
    expect(data.items.map((item) => item.title)).toEqual(['Severance']);
    expect(data.footer).toBe('druthers.io/u/avery');
  });

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

  it('passes fetched poster bytes directly to the OG renderer', async () => {
    const posterBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(posterBytes.buffer, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      }),
    );

    const data = profileOgData({
      ...profile,
      shelves: [
        {
          ...profile.shelves[0],
          items: [
            {
              ...profile.shelves[0].items[0],
              poster_url: 'https://images.example/severance.jpg',
            },
          ],
        },
      ],
    });
    const embedded = await embedPosters(data);

    expect(embedded.items[0].posterUrl).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(embedded.items[0].posterUrl as ArrayBuffer)).toEqual(posterBytes);
  });

  it('falls back to text for failed and non-image poster responses', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(
        new Response('<html>not an image</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      );
    const data = {
      ...profileOgData(profile),
      items: [
        { rank: 1, title: 'One', year: 2001, posterUrl: 'https://images.example/one.jpg' },
        { rank: 2, title: 'Two', year: 2002, posterUrl: 'https://images.example/two.jpg' },
      ],
    };

    const embedded = await embedPosters(data);

    expect(embedded.items.map((item) => item.posterUrl)).toEqual([null, null]);
  });
});

describe('generic card for profiles the caller may not see (web#200)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('carries nothing that identifies a user', () => {
    const data = genericOgData();
    const html = renderToStaticMarkup(<OgShareCard data={data} />);

    expect(data.footer).toBe('druthers.io');
    expect(data.eyebrow).not.toContain('@');
    // A handle reaching this card in any form would make it an enumeration
    // oracle, which is the whole reason the three cases render alike.
    expect(html).not.toContain('avery');
    expect(html).not.toContain('/u/');
  });

  it('is identical for every hidden case, so private and absent cannot be told apart', () => {
    // The routes call genericOgData() with no arguments precisely so that a
    // friends-only profile, a private one, and a handle that does not exist
    // cannot produce different bytes.
    const forPrivate = renderToStaticMarkup(<OgShareCard data={genericOgData()} />);
    const forFriendsOnly = renderToStaticMarkup(<OgShareCard data={genericOgData()} />);
    const forMissing = renderToStaticMarkup(<OgShareCard data={genericOgData()} />);

    expect(forFriendsOnly).toBe(forPrivate);
    expect(forMissing).toBe(forPrivate);
  });

  it('still renders its panels when every poster host fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));
    const embedded = await embedPosters(genericOgData());
    const html = renderToStaticMarkup(<OgShareCard data={embedded} />);

    expect(embedded.items).toHaveLength(3);
    expect(embedded.items.every((item) => item.posterUrl === null)).toBe(true);
    expect(html).toContain('What would you rather?');
  });
});
