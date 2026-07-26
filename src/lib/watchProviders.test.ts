import { describe, it, expect } from 'vitest';
import { watchTiers } from './watchProviders';
import type { WatchProvider, WatchProviders } from './types';

function provider(name: string): WatchProvider {
  return { provider_id: name.length, name, logo_url: `/${name}.jpg` };
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

describe('watchTiers', () => {
  it('orders tiers subscription-first and keeps provider order', () => {
    const tiers = watchTiers(
      providers({
        buy: [provider('Amazon')],
        stream: [provider('Max'), provider('Netflix')],
        free: [provider('Tubi')],
        rent: [provider('Apple TV')],
      }),
    );

    expect(tiers.map((t) => t.key)).toEqual(['stream', 'free', 'rent', 'buy']);
    expect(tiers.map((t) => t.label)).toEqual(['Stream', 'Free', 'Rent', 'Buy']);
    expect(tiers[0].providers.map((p) => p.name)).toEqual(['Max', 'Netflix']);
  });

  it('drops empty tiers', () => {
    const tiers = watchTiers(providers({ rent: [provider('Apple TV')] }));
    expect(tiers.map((t) => t.key)).toEqual(['rent']);
  });

  it('returns nothing when the title has no availability', () => {
    // The API answers with empty buckets for "nowhere", "unresolvable" and
    // "TMDB was down" alike — all three render as no section.
    expect(watchTiers(providers())).toEqual([]);
  });

  it('returns nothing when the lookup was skipped entirely', () => {
    expect(watchTiers(null)).toEqual([]);
  });
});
