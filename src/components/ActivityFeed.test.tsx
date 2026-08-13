/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityFeed } from './ActivityFeed';

const ownItem = {
  category: 'movie' as const,
  action: 'ranked' as const,
  title: 'My Movie',
  subtitle: null,
  entity_id: 'mine',
  poster_url: null,
  rank: 1,
  occurred_at: '2026-08-12T10:00:00Z',
};

const socialItem = {
  ...ownItem,
  title: 'Grace Movie',
  entity_id: 'grace-movie',
  occurred_at: '2026-08-12T11:00:00Z',
  actor: { id: 'grace', handle: 'grace', display_name: 'Grace Hopper' },
};

describe('ActivityFeed', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function renderFeed(props: Partial<React.ComponentProps<typeof ActivityFeed>> = {}) {
    return render(
      <ActivityFeed
        ownItems={[ownItem]}
        initialSocialItems={[socialItem]}
        initialNextCursor={null}
        friends={[{ id: 'friendship', user: socialItem.actor, friends_since: '2026-01-01T00:00:00Z' }]}
        following={[]}
        {...props}
      />,
    );
  }

  it('defaults to only the viewer activity and adds a selected friend alongside it', () => {
    renderFeed();

    expect(screen.getByText('My Movie')).toBeTruthy();
    expect(screen.queryByText('Grace Movie')).toBeNull();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Grace Hopper' }));

    expect(screen.getByText('Grace Movie')).toBeTruthy();
    expect(screen.getAllByText('Grace Hopper')).toHaveLength(2);
    expect(window.sessionStorage.getItem('druthers_activity_people')).toBe('["grace"]');
  });

  it('restores the selected people for a later activity-page mount', async () => {
    window.sessionStorage.setItem('druthers_activity_people', '["grace"]');
    renderFeed();

    await waitFor(() => expect(screen.getByText('Grace Movie')).toBeTruthy());
    expect(screen.getByRole('checkbox', { name: 'Include Grace Hopper' })).toHaveProperty('checked', true);
  });

  it('applies the category chip filter to selected social activity too', () => {
    renderFeed({ category: 'book', ownItems: [] });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Grace Hopper' }));

    expect(screen.queryByText('Grace Movie')).toBeNull();
  });

  it('gets the next keyset page through the BFF and includes matching selected activity', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        items: [{ ...socialItem, title: 'Grace Book', category: 'book', entity_id: 'grace-book' }],
        next_cursor: null,
      }),
    );
    renderFeed({ initialNextCursor: 'next-page' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Grace Hopper' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load more activity' }));

    await waitFor(() => expect(screen.getByText('Grace Book')).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith('/api/activity/feed?cursor=next-page');
  });
});
