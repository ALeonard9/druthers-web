/** @vitest-environment happy-dom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LengthControl } from './LengthControl';

describe('LengthControl Component', () => {
  it('renders radio options and highlights the selected option', () => {
    const onChange = vi.fn();
    render(<LengthControl value="50" onChange={onChange} />);

    expect(screen.getByRole('radiogroup', { name: 'List length' })).toBeTruthy();
    const btn50 = screen.getByRole('radio', { name: '50' });
    expect(btn50.getAttribute('aria-checked')).toBe('true');

    const btn100 = screen.getByRole('radio', { name: '100' });
    expect(btn100.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(btn100);
    expect(onChange).toHaveBeenCalledWith('100');
  });
});
