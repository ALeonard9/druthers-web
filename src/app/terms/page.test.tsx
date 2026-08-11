/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TermsPage from './page';

describe('Terms of Use page', () => {
  afterEach(cleanup);

  it('renders the draft warning banner', () => {
    render(<TermsPage />);
    expect(screen.getByText(/pending legal review by Adam/i)).toBeDefined();
  });

  // There is no company behind druthers.io. Naming an entity that does not
  // exist is the one mistake a terms page cannot make, so pin its absence.
  it('claims no corporate entity', () => {
    const { container } = render(<TermsPage />);
    expect(container.textContent).not.toMatch(/LLC|Inc\.|Ltd|Corporation/);
    expect(screen.getAllByText(/independently run personal project/).length).toBeGreaterThan(0);
  });
});
