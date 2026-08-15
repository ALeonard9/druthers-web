/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EnableShelfPage from './page';

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), getSessionUser: vi.fn(), redirect: vi.fn() }));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('@/lib/api', () => ({
  apiFetch: mocks.apiFetch,
  ApiError: class extends Error { constructor(public status: number, message: string) { super(message); } },
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));

describe('enable shelf page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer' });
    mocks.apiFetch.mockResolvedValue({
      shelf_order: ['movies', 'tv', 'games', 'books'],
      enabled_shelves: ['tv', 'games', 'books'],
    });
  });

  afterEach(cleanup);

  it('shows a named prompt for a disabled shelf', async () => {
    render(await EnableShelfPage({
      searchParams: Promise.resolve({ shelf: 'movies', next: '/movies/ranking?item=42' }),
    }));

    expect(screen.getByRole('heading', { name: 'Enable Movies?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enable Movies' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back to Shelf Settings' })).toBeTruthy();
  });

  it('uses the shelf home instead of an unsafe next URL', async () => {
    const view = await EnableShelfPage({
      searchParams: Promise.resolve({ shelf: 'movies', next: 'https://attacker.example' }),
    });

    expect(view.props.destination).toBe('/movies?view=icons');
  });
});
