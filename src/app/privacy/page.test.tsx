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

  it('mentions Lady Bird LLC as the operating entity', () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/Lady Bird LLC/).length).toBeGreaterThan(0);
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
