/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PrivacyPage from './page';

describe('Privacy Policy page', () => {
  afterEach(cleanup);

  it('renders the draft warning banner', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/pending legal review by Adam/i)).toBeDefined();
  });

  // There is no company behind druthers.io — see the matching terms test.
  it('claims no corporate entity', () => {
    const { container } = render(<PrivacyPage />);
    expect(container.textContent).not.toMatch(/LLC|Inc\.|Ltd|Corporation/);
    expect(screen.getAllByText(/independently run personal project/).length).toBeGreaterThan(0);
  });

  it('explicitly mentions the required data flows', () => {
    render(<PrivacyPage />);

    // Check for Google OAuth
    expect(screen.getAllByText(/Google OAuth/).length).toBeGreaterThan(0);

    // Check for Goodreads import
    expect(screen.getAllByText(/Goodreads/).length).toBeGreaterThan(0);

    // Check for APIs
    expect(screen.getAllByText(/TMDB/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Open Library/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IGDB/).length).toBeGreaterThan(0);

    // Check for Neon hosting
    expect(screen.getAllByText(/Neon-hosted/).length).toBeGreaterThan(0);
  });
});
