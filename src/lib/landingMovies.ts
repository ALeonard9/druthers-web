import type { DeckItem } from './deck';

/**
 * Fixed sets of widely recognisable movies for the signed-out landing page
 * (web#134) — deliberately not tied to any one account's real rankings
 * (Adam: "this should not be tied to a user"), so it can't end up showing a
 * stranger's obscure or mismatched titles. Poster paths are real TMDB
 * assets, hand-picked for recognisability rather than fetched live.
 *
 * The duel and the carousel use disjoint titles (Adam: "the carousel should
 * have 5 different movies, not in the duel") so a visitor never sees the
 * same poster twice while scrolling the page.
 */
interface LandingMovie {
  title: string;
  year: number;
  posterPath: string;
}

const DUEL_MOVIES: LandingMovie[] = [
  { title: 'The Matrix', year: 1999, posterPath: '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg' },
  { title: 'Spider-Man: No Way Home', year: 2021, posterPath: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg' },
];

const CAROUSEL_MOVIES: LandingMovie[] = [
  { title: 'The Godfather', year: 1972, posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
  { title: 'Parasite', year: 2019, posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
  { title: 'Mad Max: Fury Road', year: 2015, posterPath: '/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg' },
  { title: 'Spirited Away', year: 2001, posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
  { title: 'Star Wars', year: 1977, posterPath: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg' },
];

function posterUrl(path: string): string {
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function toDeckItem(m: LandingMovie, rank: number): DeckItem {
  return {
    id: m.title,
    rank,
    title: m.title,
    subtitle: String(m.year),
    posterUrl: posterUrl(m.posterPath),
    href: '',
  };
}

export const LANDING_DUEL_ITEMS: DeckItem[] = DUEL_MOVIES.map(toDeckItem);
export const LANDING_CAROUSEL_ITEMS: DeckItem[] = CAROUSEL_MOVIES.map((m, i) =>
  toDeckItem(m, i + 1),
);
