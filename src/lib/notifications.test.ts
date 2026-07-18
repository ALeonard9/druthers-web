import { describe, it, expect } from 'vitest';
import { notificationHref, badgeLabel } from './notifications';
import type { Notification } from './types';

function notification(partial: Partial<Notification>): Notification {
  return {
    id: 'n1',
    type: 'movie_release',
    title: 'Dune hits theaters soon',
    body: null,
    category: 'movie',
    entity_id: 'm1',
    read: false,
    created_at: '2026-07-17T10:00:00',
    ...partial,
  };
}

describe('notificationHref', () => {
  it('links to the entity detail page per category', () => {
    expect(notificationHref(notification({}))).toBe('/movies/m1');
    expect(
      notificationHref(notification({ category: 'tv_show', entity_id: 's1' })),
    ).toBe('/tv/s1');
  });

  it('returns null when there is no link target', () => {
    expect(notificationHref(notification({ category: null }))).toBeNull();
    expect(notificationHref(notification({ entity_id: null }))).toBeNull();
  });
});

describe('badgeLabel', () => {
  it('hides the badge at zero', () => {
    expect(badgeLabel(0)).toBeNull();
  });

  it('shows exact counts up to 9', () => {
    expect(badgeLabel(1)).toBe('1');
    expect(badgeLabel(9)).toBe('9');
  });

  it('caps at 9+', () => {
    expect(badgeLabel(10)).toBe('9+');
    expect(badgeLabel(120)).toBe('9+');
  });
});
