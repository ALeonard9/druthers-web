/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveShelfPreferences } from '@/lib/shelfPreferences';
import { ShelfManager } from './ShelfManager';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

describe('ShelfManager', () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.push.mockReset();
  });

  afterEach(cleanup);

  it('turns a shelf off and saves the changed enabled set', async () => {
    render(<ShelfManager />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Turn Movies off' }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('druthers:shelf-preferences') ?? '{}')).toMatchObject({
        enabled: ['tv', 'books', 'games'],
      });
    });
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('starts the five-title setup when a shelf is turned back on', async () => {
    saveShelfPreferences({
      order: ['movies', 'tv', 'books', 'games'],
      enabled: ['movies', 'tv', 'games'],
    });
    render(<ShelfManager />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Turn Books on' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/onboarding?shelf=books'));
    expect(JSON.parse(localStorage.getItem('druthers:shelf-preferences') ?? '{}')).toMatchObject({
      enabled: ['movies', 'tv', 'games', 'books'],
    });
  });
});
