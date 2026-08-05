/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddFromSearchButton } from './AddFromSearchButton';
import { MultiAddMode } from './MultiAddMode';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/pop', () => ({ playPop: vi.fn() }));

const cases = [
  ['movies', { tmdb: 1, title: 'Movie' }],
  ['tv', { tvmaze: 1, title: 'Show' }],
  ['games', { igdb: 1, title: 'Game' }],
  ['books', { isbn: '123', title: 'Book' }],
] as const;

describe('MultiAddMode (web#168)', () => {
  afterEach(cleanup);

  beforeEach(() => {
    push.mockReset();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('starts off and can be toggled on and back off', () => {
    render(
      <MultiAddMode>
        <span>Results</span>
      </MultiAddMode>,
    );

    const toggle = screen.getByRole('switch', { name: 'Keep adding without leaving results' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it.each(cases)('keeps %s results in place after a successful add', async (domain, payload) => {
    render(
      <MultiAddMode>
        <AddFromSearchButton domain={domain} payload={payload} />
      </MultiAddMode>,
    );

    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));

    await waitFor(() => expect(screen.getByText('✓ On your list')).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith(`/api/${domain}/add`, expect.anything());
    expect(push).not.toHaveBeenCalled();
  });

  it('preserves the existing navigation when keep-adding mode is off', async () => {
    render(
      <MultiAddMode>
        <AddFromSearchButton domain="movies" payload={{ tmdb: 1, title: 'Movie' }} />
      </MultiAddMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/movies'));
  });
});
