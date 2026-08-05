export type MediaDomain = 'movies' | 'tv' | 'books' | 'games';

export interface WatchlistLabels {
  singular: string;
  added: string;
  add_button: string;
  on_badge: string;
  header: string;
  queued: string;
}

const DOMAIN_WATCHLIST_LABELS: Record<MediaDomain, WatchlistLabels> = {
  movies: {
    singular: 'Watchlist',
    added: 'Added to Watchlist',
    add_button: '+ Watchlist',
    on_badge: 'On Watchlist',
    header: 'Watchlist',
    queued: 'queued on Watchlist',
  },
  tv: {
    singular: 'Watchlist',
    added: 'Added to Watchlist',
    add_button: '+ Watchlist',
    on_badge: 'On Watchlist',
    header: 'Watchlist',
    queued: 'queued on Watchlist',
  },
  books: {
    singular: 'Read List',
    added: 'Added to Read List',
    add_button: '+ Read List',
    on_badge: 'On Read List',
    header: 'Read List',
    queued: 'queued on Read List',
  },
  games: {
    singular: 'Play List',
    added: 'Added to Play List',
    add_button: '+ Play List',
    on_badge: 'On Play List',
    header: 'Play List',
    queued: 'queued on Play List',
  },
};

export function getWatchlistLabels(domain: MediaDomain | string): WatchlistLabels {
  const normDomain = (domain || '').toLowerCase() as MediaDomain;
  return DOMAIN_WATCHLIST_LABELS[normDomain] ?? DOMAIN_WATCHLIST_LABELS.movies;
}
