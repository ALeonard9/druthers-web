/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityItem } from '@/lib/types';
import { HomeActivity } from './HomeActivity';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));

function item(partial: Partial<ActivityItem> & { entity_id: string }): ActivityItem {
  return {
    category: 'movie',
    action: 'watchlist_added',
    title: 'Inception',
    subtitle: null,
    poster_url: null,
    rank: null,
    occurred_at: '2026-07-16T10:00:00',
    ...partial,
  };
}

describe('HomeActivity', () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders the episode subtitle as secondary text beside the show title link', async () => {
    mocks.apiFetch.mockResolvedValue([
      item({
        entity_id: 'show-42',
        category: 'tv_episode',
        action: 'watched_episode',
        title: 'Severance',
        subtitle: 'S2E5 - Woe’s Hollow',
      }),
    ]);

    render(await HomeActivity());

    const showLink = screen.getByRole('link', { name: 'Severance' });
    expect(showLink.getAttribute('href')).toBe('/tv/show-42');

    const subtitle = screen.getByText('S2E5 - Woe’s Hollow');
    expect(subtitle.tagName).toBe('SPAN');
    expect(showLink.textContent).toBe('Severance');
    expect(subtitle.textContent).toBe('S2E5 - Woe’s Hollow');

    const action = screen.getByText('Watched');
    expect(showLink.nextElementSibling).toBe(subtitle);
    expect(subtitle.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('lets the subtitle ellipsize rather than push the action label off a narrow row', async () => {
    mocks.apiFetch.mockResolvedValue([
      item({
        entity_id: 'show-42',
        category: 'tv_episode',
        action: 'watched_episode',
        title: 'Severance',
        subtitle: 'S2E5 - A Very Long Episode Title That Must Not Break The Layout',
      }),
    ]);

    render(await HomeActivity());

    const subtitle = screen.getByText(
      'S2E5 - A Very Long Episode Title That Must Not Break The Layout',
    );
    expect(subtitle.className).toContain('truncate');
    expect(subtitle.className).toContain('min-w-0');
    expect(screen.getByRole('link', { name: 'Severance' }).className).toContain('min-w-0');
  });

  it('does not render a subtitle for movie, book, or game rows', async () => {
    mocks.apiFetch.mockResolvedValue([
      item({ entity_id: 'm1', category: 'movie', action: 'marked_done', title: 'Inception' }),
      item({ entity_id: 'b1', category: 'book', action: 'watchlist_added', title: 'Dune' }),
      item({ entity_id: 'g1', category: 'game', action: 'ranked', title: 'Hades', rank: 2 }),
    ]);

    render(await HomeActivity());

    expect(screen.getByRole('link', { name: 'Inception' }).getAttribute('href')).toBe(
      '/movies/m1',
    );
    expect(screen.getByText('Dune')).toBeTruthy();
    expect(screen.getByText('Hades')).toBeTruthy();
    expect(screen.getByText('Watched')).toBeTruthy();
    expect(screen.getByText('Added to Read List')).toBeTruthy();
    expect(screen.getByText('Ranked #2')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
