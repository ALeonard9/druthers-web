/** @vitest-environment happy-dom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GlobalError from './global-error';

describe('global error backstop', () => {
  it('renders a standalone recovery document with a working retry action', () => {
    const retry = vi.fn();
    const document = GlobalError({ error: new Error('boom'), retry });

    expect(document.type).toBe('html');
    render(document.props.children);
    expect(screen.getByRole('heading', { name: 'Druthers hit a snag' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
