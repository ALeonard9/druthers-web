import { describe, it, expect } from 'vitest';
import { boredHref } from './bored';
import type { BoredItem } from './types';

function item(partial: Partial<BoredItem> & { entity_id: string }): BoredItem {
  return {
    category: 'movie',
    title: 'Inception',
    subtitle: null,
    poster_url: null,
    ...partial,
  };
}

describe('boredHref', () => {
  it('links each category to its detail page', () => {
    expect(boredHref(item({ entity_id: 'm1', category: 'movie' }))).toBe('/movies/m1');
    expect(boredHref(item({ entity_id: 's1', category: 'tv_show' }))).toBe('/tv/s1');
    expect(boredHref(item({ entity_id: 'g1', category: 'game' }))).toBe('/games/g1');
    expect(boredHref(item({ entity_id: 'b1', category: 'book' }))).toBe('/books/b1');
    expect(boredHref(item({ entity_id: 'c1', category: 'country' }))).toBe(
      '/countries/c1',
    );
  });
});
