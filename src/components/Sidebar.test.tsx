/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            shelf_order: ['games', 'books', 'movies', 'tv'],
            enabled_shelves: ['games', 'movies'],
          }),
        ),
      ),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows enabled shelf links in the account preference order', async () => {
    render(<Sidebar />);

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Books' })).toBeNull());
    expect(screen.queryByRole('link', { name: 'TV' })).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Games' }).compareDocumentPosition(
        screen.getByRole('link', { name: 'Movies' }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(fetch).toHaveBeenCalledWith('/api/preferences');
  });

  it('hides the Admin link with no user', () => {
    render(<Sidebar />);
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('hides the Admin link for a non-admin user_group', () => {
    render(<Sidebar user={{ user_id: '1', email: 'a@example.com', user_group: 'user' }} />);
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('shows the Admin link only when the readable cookie claims user_group "admin" - a rendering decision only, not the real gate', () => {
    render(<Sidebar user={{ user_id: '1', email: 'a@example.com', user_group: 'admin' }} />);
    expect(screen.getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin');
  });
});
