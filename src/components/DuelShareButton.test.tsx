/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DuelShareButton, duelComposerUrl } from './DuelShareButton';
import type { DuelShareCard } from '@/lib/duelShareCardRender';

const card: DuelShareCard = {
  left: { id: 'left', title: 'Left contender', subtitle: '2001', imageUrl: null, emoji: null, rank: 1 },
  right: { id: 'right', title: 'Right contender', subtitle: '2002', imageUrl: null, emoji: null, rank: 2 },
};

describe('DuelShareButton', () => {
  afterEach(cleanup);

  it('puts image copy first and offers only image-based Facebook and X actions', () => {
    render(<DuelShareButton card={card} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share this duel' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Copy image',
      'Share on Facebook',
      'Share on X',
    ]);
    expect(screen.queryByText(/Copy URL/i)).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Copy image' }).querySelector('svg')).toBeTruthy();
  });

  it('opens the duel formatter and dismisses it with Escape', () => {
    render(<DuelShareButton card={card} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share this duel' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on Facebook' }));

    expect(screen.getByRole('dialog', { name: 'Format duel for Facebook' })).toBeTruthy();
    expect(screen.getByText('Format this duel')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uses the Facebook composer fallback in an installed PWA', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });

    render(<DuelShareButton card={card} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share this duel' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share on Facebook' }));

    expect(screen.getByRole('button', { name: 'Copy image & open Facebook' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Share image…' })).toBeNull();
  });
});

describe('duelComposerUrl', () => {
  it('opens Facebook composer with only the generic public Druthers URL', () => {
    expect(duelComposerUrl('facebook')).toBe(
      'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.druthers.io',
    );
  });
});
