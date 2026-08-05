/**
 * Sub-navigation for each collection, shared so the pages rendering a given
 * set can't drift apart. Every domain's root is now the poster deck of its
 * top ranked titles; the drag-to-reorder board sits one level down at
 * `/{domain}/ranking`. The last tab keeps each domain's own name for its
 * not-yet-ranked pile.
 */
export const MOVIE_TABS = [
  { href: '/movies', label: 'My Favorite Movies' },
  { href: '/movies/ranking', label: 'Ranking' },
  { href: '/movies/watchlist', label: 'Watchlist' },
];

export const TV_TABS = [
  { href: '/tv', label: 'My Favorite Shows' },
  { href: '/tv/ranking', label: 'Ranking' },
  { href: '/tv/watchlist', label: 'Watchlist' },
  { href: '/tv/schedule', label: 'Schedule' },
];

export const BOOK_TABS = [
  { href: '/books', label: 'My Favorite Books' },
  { href: '/books/ranking', label: 'Ranking' },
  { href: '/books/to-read', label: 'Read List' },
];

export const GAME_TABS = [
  { href: '/games', label: 'My Favorite Games' },
  { href: '/games/ranking', label: 'Ranking' },
  { href: '/games/backlog', label: 'Play List' },
];
