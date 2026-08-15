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

    // /beta/i alone matches twice - the chip label and the sentence - and
    // getByText throws on multiple matches. Assert each element separately so
    // the test says which one it means.
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText(/druthers is in beta/i)).toBeTruthy();
    expect(screen.getByText(/frequent changes/i)).toBeTruthy();
  });

  it('treats the env value case-insensitively, like EnvBadge', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'QA';
    render(<EnvBanner />);

    expect(screen.getByText(/no entry permitted/i)).toBeTruthy();
  });

  it('pads the QA banner below the status bar / notch in the installed PWA', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'qa';
    render(<EnvBanner />);

    // happy-dom's CSS parser can't round-trip env() through inline styles
    // (the style attribute comes back empty), so the safe-area padding rides
    // a Tailwind arbitrary-value class - same as AppShell's bottom inset.
    // The string pins both halves of the fix: the 0.5rem py-2 baseline (no
    // layout shift in a browser tab, where env() is 0) and the env() inset.
    expect(screen.getByRole('note').className).toContain(
      'pt-[calc(0.5rem+env(safe-area-inset-top))]',
    );
  });

  it('pads the Beta banner below the status bar / notch too', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'prod';
    render(<EnvBanner />);

    expect(screen.getByRole('note').className).toContain(
      'pt-[calc(0.5rem+env(safe-area-inset-top))]',
    );
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
