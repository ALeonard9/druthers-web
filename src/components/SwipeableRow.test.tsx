/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SwipeableRow } from './SwipeableRow';

describe('SwipeableRow', () => {
  it('paints the foreground with the parent background while actions are closed', () => {
    render(
      <SwipeableRow
        className="bg-panel"
        rightActions={<span>Remove</span>}
      >
        <span>Card content</span>
      </SwipeableRow>,
    );

    const foreground = screen.getByText('Card content').parentElement;
    expect(foreground?.className).toContain('bg-inherit');
  });
});
