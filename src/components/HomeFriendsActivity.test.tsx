/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SocialActivityItem } from '@/lib/types';
import { HomeFriendsActivity } from './HomeFriendsActivity';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));

function item(partial: Partial<SocialActivityItem> = {}): SocialActivityItem {
  return {
    category: 'movie',
    action: 'ranked',
    title: 'Interstellar',
    subtitle: null,
    entity_id: 'movie-1',
    poster_url: null,
    rank: 1,
    occurred_at: '2026-08-13T10:00:00Z',
    actor: { id: 'friend-1', display_name: 'Friend', handle: 'friend' },
    ...partial,
  };
}

describe('HomeFriendsActivity', () => {
  beforeEach(() => mocks.apiFetch.mockReset());
  afterEach(cleanup);

  it('shows only a compact three-item preview from the visibility-filtered feed', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [
        item(),
        item({ entity_id: 'movie-2', title: 'Whiplash', occurred_at: '2026-08-13T09:00:00Z' }),
        item({ entity_id: 'movie-3', title: 'Arrival', occurred_at: '2026-08-13T08:00:00Z' }),
        item({ entity_id: 'movie-4', title: 'Heat', occurred_at: '2026-08-13T07:00:00Z' }),
      ],
      next_cursor: 'later',
    });

    render(await HomeFriendsActivity());

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/feed?limit=3');
    const preview = screen.getByRole('list', { name: 'Latest friend activity' });
    expect(preview.children).toHaveLength(3);
    expect(screen.getAllByText('Friend')).toHaveLength(3);
    expect(preview.textContent).toContain('Ranked #1');
    expect(screen.getByRole('link', { name: 'Interstellar' }).getAttribute('href')).toBe('/movies/movie-1');
    const actorLinks = screen.getAllByRole('link', { name: 'Friend' });
    expect(actorLinks).toHaveLength(3);
    for (const link of actorLinks) {
      expect(link.getAttribute('href')).toBe('/u/friend');
    }
    expect(screen.queryByText('Heat')).toBeNull();
    expect(screen.getByRole('link', { name: 'See all activity' }).getAttribute('href')).toBe('/activity');
  });

  it('links the actor name to their profile by id when no handle is claimed', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [item({ actor: { id: 'friend-1', display_name: 'Friend', handle: null } })],
      next_cursor: null,
    });

    render(await HomeFriendsActivity());

    expect(screen.getByRole('link', { name: 'Friend' }).getAttribute('href')).toBe('/u/friend-1');
  });

  it('renders an unregistered actor name as plain text', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [item({ actor: { id: '', display_name: null, handle: null } })],
      next_cursor: null,
    });

    render(await HomeFriendsActivity());

    expect(screen.getByText('A friend')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'A friend' })).toBeNull();
  });

  it('invites the viewer to add friends when the feed has no visible activity', async () => {
    mocks.apiFetch.mockResolvedValue({ items: [], next_cursor: null });

    render(await HomeFriendsActivity());

    expect(screen.getByText(/No friend activity yet/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Add friends' }).getAttribute('href')).toBe('/friends');
    expect(screen.queryByRole('list', { name: 'Latest friend activity' })).toBeNull();
  });
});
