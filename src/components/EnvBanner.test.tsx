/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnvBanner } from './EnvBanner';

describe('EnvBanner', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_APP_ENV;
  });

  afterEach(cleanup);

  it('renders nothing in dev by default', () => {
    const { container } = render(<EnvBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for an unknown environment', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    const { container } = render(<EnvBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('marks QA as test-only, no entry, and points visitors at admin@druthers.io', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'qa';
    render(<EnvBanner />);

    expect(screen.getByText(/for testing purposes only/i)).toBeTruthy();
    expect(screen.getByText(/no entry permitted/i)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'admin@druthers.io' }).getAttribute('href'),
    ).toBe('mailto:admin@druthers.io');
  });

  it('marks prod as a beta expecting frequent changes', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'prod';
    render(<EnvBanner />);

    expect(screen.getByText(/beta/i)).toBeTruthy();
    expect(screen.getByText(/frequent changes/i)).toBeTruthy();
  });

  it('treats the env value case-insensitively, like EnvBadge', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'QA';
    render(<EnvBanner />);

    expect(screen.getByText(/no entry permitted/i)).toBeTruthy();
  });

  it('dismisses and remembers the choice for the session', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'qa';
    const { unmount } = render(<EnvBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss environment notice' }));
    expect(screen.queryByText(/no entry permitted/i)).toBeNull();
    expect(window.sessionStorage.getItem('druthers_env_banner_dismissed_qa')).toBe('true');

    unmount();
    render(<EnvBanner />);
    expect(screen.queryByText(/no entry permitted/i)).toBeNull();
  });

  it('keeps dismissals per environment', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'qa';
    const { unmount } = render(<EnvBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss environment notice' }));
    unmount();

    process.env.NEXT_PUBLIC_APP_ENV = 'prod';
    render(<EnvBanner />);
    expect(screen.getByText(/frequent changes/i)).toBeTruthy();
  });
});
