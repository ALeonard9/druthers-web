import type { WatchProvider, WatchProviders } from './types';

/** One rendered row: a tier label and the services under it. */
export interface WatchTier {
  key: 'stream' | 'free' | 'rent' | 'buy';
  label: string;
  providers: WatchProvider[];
}

// Ordered by how a viewer would rather watch: included in a subscription
// first, then free-with-ads, then paying per title.
const TIERS: { key: WatchTier['key']; label: string }[] = [
  { key: 'stream', label: 'Stream' },
  { key: 'free', label: 'Free' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

/**
 * The non-empty tiers, in display order. The API always answers — a title
 * with no availability, one it couldn't resolve, and an upstream failure all
 * come back as empty buckets — so an empty result here is the signal to render
 * nothing at all rather than an error state.
 */
export function watchTiers(providers: WatchProviders | null): WatchTier[] {
  if (!providers) return [];
  return TIERS.map(({ key, label }) => ({
    key,
    label,
    providers: providers[key] ?? [],
  })).filter((tier) => tier.providers.length > 0);
}
