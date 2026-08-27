/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterChip } from './FilterChip';

describe('FilterChip', () => {
  afterEach(cleanup);

  it('renders the key and value', () => {
    render(<FilterChip filterKey="director" value="Nolan" onRemove={vi.fn()} />);
    expect(screen.getByText('director:')).toBeTruthy();
    expect(screen.getByText('Nolan')).toBeTruthy();
  });

  it('calls onRemove when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<FilterChip filterKey="genre" value="sci-fi" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter genre:sci-fi' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('has an accessible remove button label', () => {
    render(<FilterChip filterKey="year" value="2021" onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove filter year:2021' })).toBeTruthy();
  });

  it('renders values with spaces', () => {
    render(
      <FilterChip filterKey="director" value="Christopher Nolan" onRemove={vi.fn()} />,
    );
    expect(screen.getByText('Christopher Nolan')).toBeTruthy();
  });
});
