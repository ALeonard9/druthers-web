import { describe, expect, it } from 'vitest';
import { BOOK_TABS, GAME_TABS, MOVIE_TABS, TV_TABS } from './sectionTabs';

describe('domain section tabs', () => {
  it.each([
    ['movies', MOVIE_TABS, '/movies/ranking/list'],
    ['tv', TV_TABS, '/tv/ranking/list'],
    ['books', BOOK_TABS, '/books/ranking/list'],
    ['games', GAME_TABS, '/games/ranking/list'],
  ] as const)('opens the %s ranking board instead of the duel route', (_domain, tabs, href) => {
    expect(tabs.find((tab) => tab.label === 'Ranking')?.href).toBe(href);
  });
});
