/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  afterEach(cleanup);

  it('offers every scope in a keyboard-accessible native selector', () => {
    render(<SearchForm query="dune" scope="all" />);

    const scope = screen.getByRole('combobox', { name: 'Search scope' });
    expect(scope).toHaveProperty('value', 'all');
    expect([...scope.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All',
      'Movies',
      'TV',
      'Books',
      'Games',
      'Users',
    ]);

    fireEvent.change(scope, { target: { value: 'users' } });
    expect(scope).toHaveProperty('value', 'users');
  });

  it('submits the selected scope alongside the query in the compact top-bar layout', () => {
    render(<SearchForm compact query="ada" scope="users" />);

    expect(screen.getByRole('searchbox').closest('form')?.getAttribute('action')).toBe('/search');
    expect(screen.getByRole('combobox', { name: 'Search scope' })).toHaveProperty('value', 'users');
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'ada');
  });
});
