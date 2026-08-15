/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnableShelfPrompt } from './EnableShelfPrompt';

const navigation = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

describe('EnableShelfPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ['movies', 'Movies'],
    ['tv', 'TV'],
    ['books', 'Books'],
    ['games', 'Games'],
  ] as const)('names and enables the %s shelf before returning to its deep link', async (shelf, label) => {
    const destination = `/${shelf}/ranking?item=42`;
    render(
      <EnableShelfPrompt
        shelf={shelf}
        destination={destination}
        preferences={{ order: ['movies', 'tv', 'games', 'books'], enabled: ['movies'] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: `Enable ${label}` }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(destination));
    const request = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string).enabled_shelves).toContain(shelf);
  });

  it('exits to shelf settings without returning to the disabled page', () => {
    render(
      <EnableShelfPrompt
        shelf="books"
        destination="/books/to-read"
        preferences={{ order: ['movies', 'tv', 'games', 'books'], enabled: ['movies'] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to Shelf Settings' }));

    expect(navigation.replace).toHaveBeenCalledWith('/settings#shelves');
    expect(navigation.back).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
