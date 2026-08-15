/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeTonight } from './HomeTonight';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getViewerTimeZone: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));
vi.mock('@/lib/viewerTimeZone', () => ({ getViewerTimeZone: mocks.getViewerTimeZone }));

describe('HomeTonight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-13T03:00:00Z')); // 10pm Aug 12 in Chicago
    mocks.apiFetch.mockReset();
    mocks.getViewerTimeZone.mockReset();
    mocks.getViewerTimeZone.mockResolvedValue('America/Chicago');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('uses the schedule relative-day wording for a next-morning airdate', async () => {
    mocks.apiFetch.mockResolvedValue({
      upcoming: [
        {
          show_id: 'tires',
          show_title: 'Tires',
          episode_id: 'tires-1',
          episode_title: 'The First Episode',
          season: 1,
          season_number: 1,
          airdate: '2026-08-13T12:00:00Z',
        },
      ],
      catch_up: [],
      frozen_shows: [],
    });

    render(await HomeTonight());

    expect(screen.getByRole('heading', { name: 'Upcoming' })).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
    expect(screen.queryByText('Tonight')).toBeNull();
  });
});
