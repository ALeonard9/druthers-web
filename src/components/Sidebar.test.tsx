/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveShelfPreferences } from '@/lib/shelfPreferences';
import { Sidebar } from './Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Sidebar', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('shows enabled shelf links in the configured order', async () => {
    saveShelfPreferences({
      order: ['games', 'books', 'movies', 'tv'],
      enabled: ['games', 'movies'],
    });
    render(<Sidebar />);

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Books' })).toBeNull());
    expect(screen.queryByRole('link', { name: 'TV' })).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Games' }).compareDocumentPosition(
        screen.getByRole('link', { name: 'Movies' }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
