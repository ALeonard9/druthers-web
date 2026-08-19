/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminUserDetailView } from './AdminUserDetailView';
import type { AdminUserDetail } from '@/lib/types';

const BASE_USER: AdminUserDetail = {
  id: 'u1',
  handle: 'follower',
  display_name: 'Follower Example',
  email: 'follower@example.com',
  user_group: 'user',
  status: 'active',
  created_at: '2026-01-04T12:00:00Z',
  last_tracked_at: '2026-08-17T09:12:00Z',
  visibility: {
    profile: 'private',
    default_privacy: 'private',
    movies: null,
    tv: null,
    books: null,
    games: null,
    watchlist_movies: null,
    watchlist_tv: null,
    watchlist_books: null,
    watchlist_games: null,
    share_activity: true,
  },
  domains: {
    movies: { ranked: 1, watchlist: 1, total: 2 },
    tv: { ranked: 0, watchlist: 0, total: 0 },
    books: { ranked: 0, watchlist: 0, total: 0 },
    games: { ranked: 0, watchlist: 0, total: 0 },
  },
  social: { friends: 1, followers: 1, following: 1 },
};

describe('AdminUserDetailView', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows a Disable button but no confirmation dialog until it is clicked', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} />);

    expect(screen.getByRole('button', { name: 'Disable account' })).toBeTruthy();
    expect(screen.queryByText(/signs them out immediately/)).toBeNull();
  });

  it('opens the inline confirmation dialog on Disable, naming the target by handle', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    expect(screen.getByText(/signs them out immediately/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Disable @follower' })).toBeTruthy();
  });

  it('does not show a confirmation dialog for Enable - it fires immediately', async () => {
    const disabledUser = { ...BASE_USER, status: 'disabled' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...disabledUser, status: 'active' }), { status: 200 }),
      ),
    );

    render(<AdminUserDetailView initialUser={disabledUser} />);

    expect(screen.queryByText(/signs them out immediately/)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enable account' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/u1/enable', { method: 'POST' });
    expect(screen.queryByText(/signs them out immediately/)).toBeNull();
  });

  it('calls the disable endpoint and reflects the new status only on Confirm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...BASE_USER, status: 'disabled' }), { status: 200 }),
      ),
    );

    render(<AdminUserDetailView initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disable @follower' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/u1/disable', { method: 'POST' });
    expect(screen.getByText('disabled')).toBeTruthy();
    // Dialog closes once the action lands.
    expect(screen.queryByText(/signs them out immediately/)).toBeNull();
  });

  it('does not call the API when the dialog is cancelled', () => {
    vi.stubGlobal('fetch', vi.fn());

    render(<AdminUserDetailView initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/signs them out immediately/)).toBeNull();
  });

  it('surfaces the guard error message rather than a generic failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'You cannot disable your own account.' }),
          { status: 403 },
        ),
      ),
    );

    render(<AdminUserDetailView initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disable @follower' }));
    });

    expect(screen.getByRole('alert').textContent).toBe('You cannot disable your own account.');
    // Status is unchanged - the guard refused the action.
    expect(screen.getByText('active')).toBeTruthy();
  });

  it('shows a View as button for a non-admin target', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} />);

    expect(screen.getByRole('button', { name: 'View as @follower' })).toBeTruthy();
  });

  it('never shows View as for a target who is an admin', () => {
    render(<AdminUserDetailView initialUser={{ ...BASE_USER, user_group: 'admin' }} />);

    expect(screen.queryByRole('button', { name: /View as/ })).toBeNull();
  });

  it('shows the impersonation-expired message when landed here with that param', () => {
    render(
      <AdminUserDetailView
        initialUser={BASE_USER}
        impersonationExpired
        expiredImpersonationHandle="private-user"
      />,
    );

    expect(
      screen.getByText('Your view-as session for @private-user expired.'),
    ).toBeTruthy();
  });

  it('still shows the expiry message with no handle - a target can genuinely have none', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} impersonationExpired />);

    expect(screen.getByText('Your view-as session expired.')).toBeTruthy();
  });

  it('shows a warning, not a clean "you are back", when the stop call could not confirm the session ended', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} impersonationStopWarning />);

    expect(screen.getByText(/Could not confirm the view-as session ended/)).toBeTruthy();
  });

  it('shows no expiry message on a normal visit', () => {
    render(<AdminUserDetailView initialUser={BASE_USER} />);

    expect(screen.queryByText(/view-as session/)).toBeNull();
  });
});
