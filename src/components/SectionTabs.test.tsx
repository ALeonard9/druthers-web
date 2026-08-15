/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionTabs } from './SectionTabs';

const mocks = vi.hoisted(() => ({ pathname: '/movies' }));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

const TABS = [
  { href: '/movies', label: 'My Favorite Movies' },
  { href: '/movies/ranking/list', label: 'Ranking' },
  { href: '/movies/watchlist', label: 'Watchlist' },
];

describe('SectionTabs', () => {
  afterEach(() => {
    cleanup();
    mocks.pathname = '/movies';
  });

  it('highlights the tab matching the current path', () => {
    render(<SectionTabs tabs={TABS} />);
    expect(screen.getByRole('link', { name: 'My Favorite Movies' }).className).toContain(
      'border-brass',
    );
  });

  it('renders a leading icon when one is passed (web#282)', () => {
    const view = render(
      <SectionTabs
        tabs={TABS}
        icon={<svg data-testid="rail-icon" viewBox="0 0 24 24" />}
      />,
    );
    expect(screen.getByTestId('rail-icon')).toBeTruthy();
    expect(
      view.container.querySelector('.tab-rail')?.querySelector('svg'),
    ).not.toBeNull();
  });

  it('omits the leading icon when none is passed', () => {
    const view = render(<SectionTabs tabs={TABS} />);
    expect(view.container.querySelector('.tab-rail')?.querySelector('svg')).toBeNull();
  });
});
