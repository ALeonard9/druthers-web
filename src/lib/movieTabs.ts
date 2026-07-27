/**
 * Sub-navigation for the Movies section, shared so the three pages that render
 * it can't drift apart. `/movies` is the poster deck of the top ranked titles;
 * the drag-to-reorder board lives one level down at `/movies/ranking`.
 */
export const MOVIE_TABS = [
  { href: '/movies', label: 'Top 25' },
  { href: '/movies/ranking', label: 'Ranking' },
  { href: '/movies/watchlist', label: 'Watchlist' },
];
