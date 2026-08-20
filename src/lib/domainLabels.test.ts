import { describe, expect, it } from 'vitest';
import { getWatchlistLabels } from './domainLabels';

describe('domainLabels helper', () => {
  it('returns Watchlist labels for movies', () => {
    const labels = getWatchlistLabels('movies');
    expect(labels.singular).toBe('Watchlist');
    expect(labels.added).toBe('Added to Watchlist');
    expect(labels.add_button).toBe('+ Watchlist');
    expect(labels.on_badge).toBe('On Watchlist');
  });

  it('returns Watchlist labels for TV', () => {
    const labels = getWatchlistLabels('tv');
    expect(labels.singular).toBe('Watchlist');
    expect(labels.added).toBe('Added to Watchlist');
    expect(labels.add_button).toBe('+ Watchlist');
    expect(labels.on_badge).toBe('On Watchlist');
  });

  it('returns Reading List labels for Books', () => {
    const labels = getWatchlistLabels('books');
    expect(labels.singular).toBe('Reading List');
    expect(labels.added).toBe('Added to Reading List');
    expect(labels.add_button).toBe('+ Reading List');
    expect(labels.on_badge).toBe('On Reading List');
  });

  it('returns Play List labels for Games', () => {
    const labels = getWatchlistLabels('games');
    expect(labels.singular).toBe('Play List');
    expect(labels.added).toBe('Added to Play List');
    expect(labels.add_button).toBe('+ Play List');
    expect(labels.on_badge).toBe('On Play List');
  });

  it('falls back gracefully for unknown domains', () => {
    const labels = getWatchlistLabels('unknown');
    expect(labels.singular).toBe('Watchlist');
  });
});
