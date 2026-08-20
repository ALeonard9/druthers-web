/** @vitest-environment happy-dom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from './error';

describe('app error backstop', () => {
  it('offers to retry the failed route segment', () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error('boom')} retry={retry} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
