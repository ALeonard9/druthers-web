import { describe, it, expect } from 'vitest';
import { duelLists, type DuelEntry } from './duelShelves';

const entry = (id: string, title: string, rank: number | null): DuelEntry => ({
  id,
  title,
  subtitle: null,
  imageUrl: null,
  emoji: null,
  rank,
});

describe('duelLists', () => {
  const shelf = [
    entry('c', 'Casino', null),
    entry('a', 'Alien', 2),
    entry('d', 'Dune', null),
    entry('b', 'Blade Runner', 1),
  ];

  it('orders the ranked side by rank and the queue by title', () => {
    const { ranked, queue } = duelLists(shelf);
    expect(ranked.map((e) => e.id)).toEqual(['b', 'a']);
    expect(queue.map((e) => e.id)).toEqual(['c', 'd']);
  });

  it('puts the focused title at the head of the queue', () => {
    const { queue } = duelLists(shelf, 'd');
    expect(queue.map((e) => e.id)).toEqual(['d', 'c']);
  });

  it('never compares an already-ranked title with itself', () => {
    // Re-ranking #1: it has to leave the ranked side, or the duel would ask
    // whether Blade Runner beats Blade Runner.
    const { ranked, queue } = duelLists(shelf, 'b');
    expect(ranked.map((e) => e.id)).toEqual(['a']);
    expect(queue[0].id).toBe('b');
    expect(queue.map((e) => e.id)).toEqual(['b', 'c', 'd']);
  });

  it('is empty-safe and ignores an unknown focus id', () => {
    expect(duelLists([], 'nope')).toEqual({ ranked: [], queue: [] });
    const { ranked, queue } = duelLists(shelf, 'nope');
    expect(ranked).toHaveLength(2);
    expect(queue).toHaveLength(2);
  });
});
