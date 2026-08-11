/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleEpisodeRow } from './ScheduleEpisodeRow';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const item = {
  show_id: 'show-42',
  show_title: 'The Example Show',
  episode_id: 'episode-7',
  episode_title: 'The Linked Episode',
  season: 2,
  season_number: 3,
  airdate: '2026-08-10',
};

describe('ScheduleEpisodeRow', () => {
  it('links the complete upcoming entry to its show detail page', () => {
    render(<ScheduleEpisodeRow item={item} showTitle />);

    const link = screen.getByRole('link', {
      name: 'The Example Show — 2.3 The Linked Episode',
    });
    expect(link.getAttribute('href')).toBe('/tv/show-42');
  });

  it('keeps catch-up episode entries navigable when their show heading is separate', () => {
    render(<ScheduleEpisodeRow item={item} />);

    const link = screen.getByRole('link', { name: '2.3 The Linked Episode' });
    expect(link.getAttribute('href')).toBe('/tv/show-42');
  });
});
