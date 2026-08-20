/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SearchSectionSkeleton } from './searchSections';

describe('search section skeleton', () => {
  it('keeps a named, busy Books slot visible while its provider is pending', () => {
    render(<SearchSectionSkeleton title="Books" />);

    const heading = screen.getByRole('heading', { name: 'Books' });
    expect(heading.closest('section')?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByLabelText('Loading books search').textContent).toContain(
      'Loading books…',
    );
  });
});
