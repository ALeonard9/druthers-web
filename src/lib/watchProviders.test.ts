import { describe, it, expect } from 'vitest';
import { streamingProviders } from './watchProviders';
import type { WatchProvider, WatchProviders } from './types';

function provider(name: string, id = name.length): WatchProvider {
  return { provider_id: id, name, logo_url: `/${name}.jpg` };
}

function providers(partial: Partial<WatchProviders> = {}): WatchProviders {
  return {
    region: 'US',
    link: 'https://www.themoviedb.org/movie/603/watch?locale=US',
    attribution: 'JustWatch',
    stream: [],
    free: [],
    rent: [],
    buy: [],
    ...partial,
  };
}

describe('streamingProviders', () => {
  it('merges stream and free, in that order', () => {
    const chips = streamingProviders(
      providers({
        stream: [provider('Max'), provider('Netflix')],
        free: [provider('Tubi')],
      }),
    );
    expect(chips.map((c) => c.name)).toEqual(['Max', 'Netflix', 'Tubi']);
  });

  it('drops rent and buy entirely, even when stream/free are empty', () => {
    const chips = streamingProviders(
      providers({ rent: [provider('Apple TV')], buy: [provider('Amazon')] }),
    );
    expect(chips).toEqual([]);
  });

  it('collapses a base/premium duplicate into one chip (web#78)', () => {
    // TMDB assigns different provider ids to the same service's tiers.
    const chips = streamingProviders(
      providers({
        stream: [provider('Peacock', 1)],
        free: [provider('Peacock Premium', 2)],
      }),
    );
    expect(chips.map((c) => c.name)).toEqual(['Peacock']);
  });

  it('keeps the stream-tier entry when a service appears in both stream and free', () => {
    const chips = streamingProviders(
      providers({
        stream: [{ provider_id: 1, name: 'Peacock', logo_url: '/sub.jpg' }],
        free: [{ provider_id: 2, name: 'Peacock Premium', logo_url: '/ad.jpg' }],
      }),
    );
    expect(chips).toEqual([
      { name: 'Peacock', logoUrl: '/sub.jpg', href: 'https://www.peacocktv.com' },
    ]);
  });

  it('links a known provider to its own site, not the JustWatch link', () => {
    const chips = streamingProviders(providers({ stream: [provider('Netflix')] }));
    expect(chips[0].href).toBe('https://www.netflix.com');
  });

  it('falls back to the region JustWatch link for an unmapped provider', () => {
    const chips = streamingProviders(providers({ stream: [provider('Some New Service')] }));
    expect(chips[0].href).toBe('https://www.themoviedb.org/movie/603/watch?locale=US');
  });

  it('falls back to "#" when unmapped and there is no JustWatch link either', () => {
    const chips = streamingProviders(
      providers({ stream: [provider('Some New Service')], link: null }),
    );
    expect(chips[0].href).toBe('#');
  });

  it('returns nothing when the title has no availability', () => {
    // The API answers with empty buckets for "nowhere", "unresolvable" and
    // "TMDB was down" alike — all three render as no section.
    expect(streamingProviders(providers())).toEqual([]);
  });

  it('returns nothing when the lookup was skipped entirely', () => {
    expect(streamingProviders(null)).toEqual([]);
  });
});
