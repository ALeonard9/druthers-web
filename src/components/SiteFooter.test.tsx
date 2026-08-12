/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter component', () => {
  afterEach(cleanup);

  it('contains links to both legal pages', () => {
    render(<SiteFooter />);

    const termsLink = screen.getByRole('link', { name: 'Terms of Use' });
    expect(termsLink.getAttribute('href')).toBe('/terms');

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink.getAttribute('href')).toBe('/privacy');
  });
});
