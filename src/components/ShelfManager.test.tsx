/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShelfManager } from './ShelfManager';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

describe('ShelfManager', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn((_: string, init?: RequestInit) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              init?.method === 'PUT'
                ? { shelf_order: ['movies', 'tv', 'games', 'books'], enabled_shelves: ['movies', 'tv', 'games', 'books'] }
                : { shelf_order: ['movies', 'tv', 'games', 'books'], enabled_shelves: ['movies', 'tv', 'games', 'books'] },
            ),
          ),
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('turns a shelf off and saves the changed enabled set', async () => {
    render(<ShelfManager />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Turn Movies off' }));

    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/preferences', expect.objectContaining({ method: 'PUT' })));
    expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body)).toEqual({
      shelf_order: ['movies', 'tv', 'games', 'books'],
      enabled_shelves: ['tv', 'games', 'books'],
    });
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('starts the five-title setup when a shelf is turned back on', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          shelf_order: ['movies', 'tv', 'games', 'books'],
          enabled_shelves: ['movies', 'tv', 'games'],
        }),
      ),
    );
    render(<ShelfManager />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Turn Books on' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/onboarding?shelf=books'));
    expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body)).toEqual({
      shelf_order: ['movies', 'tv', 'games', 'books'],
      enabled_shelves: ['movies', 'tv', 'games', 'books'],
    });
  });

  it('does not leave settings when enabling a shelf fails to save', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          shelf_order: ['movies', 'tv', 'games', 'books'],
          enabled_shelves: ['movies', 'tv', 'games'],
        })),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 500 }));
    render(<ShelfManager />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Turn Books on' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
