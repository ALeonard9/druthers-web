/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TermsPage from './page';

describe('Terms of Use page', () => {
  afterEach(cleanup);

  // These pages ship as the real policy, so the draft scaffolding must not
  // survive into production copy.
  it('carries no draft notice', () => {
    const { container } = render(<TermsPage />);
    expect(container.textContent).not.toMatch(/draft|pending legal review/i);
  });

  it('states the 18+ age requirement', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/at least 18 years old/).length).toBeGreaterThan(0);
  });

  it('gives a reachable contact address', () => {
    render(<TermsPage />);
    const link = screen.getByText('Admin@druthers.io');
    expect(link.getAttribute('href')).toBe('mailto:Admin@druthers.io');
  });

  it('describes self-service account deletion from Settings', () => {
    render(<TermsPage />);

    expect(screen.getByText(/permanently delete your account from Settings/i)).toBeTruthy();
  });

  // There is no company behind druthers.io. Naming an entity that does not
  // exist is the one mistake a terms page cannot make, so pin its absence.
  it('claims no corporate entity', () => {
    const { container } = render(<TermsPage />);
    expect(container.textContent).not.toMatch(/LLC|Inc\.|Ltd|Corporation/);
    expect(screen.getAllByText(/independently run personal project/).length).toBeGreaterThan(0);
  });
});
