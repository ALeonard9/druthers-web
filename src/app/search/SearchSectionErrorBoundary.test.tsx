/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchSectionErrorBoundary } from './SearchSectionErrorBoundary';

function BrokenSection(): never {
  throw new Error('render failed');
}

describe('SearchSectionErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('contains a render failure to the named section', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <SearchSectionErrorBoundary title="Books">
        <BrokenSection />
      </SearchSectionErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Books' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(
      'Books search is unavailable right now.',
    );
  });
});
