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

  it('mentions Lady Bird LLC as the operating entity', () => {
    render(<TermsPage />);
    expect(screen.getAllByText(/Lady Bird LLC/).length).toBeGreaterThan(0);
  });
});
