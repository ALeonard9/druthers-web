/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminUserDetailView } from './AdminUserDetailView';
import type { AdminUserDetail } from '@/lib/types';

// happy-dom's queryByText finds text inside a closed <dialog> too (it does
// not model the UA "closed dialogs render nothing" behavior the way a real
// browser does) - the dialog's own .open property is the actual signal of
// whether it's showing, and is also what showModal()/close() toggle.
function isDialogOpen(): boolean {
  return document.querySelector('dialog')?.open ?? false;
}

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
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    expect(screen.getByRole('button', { name: 'Disable account' })).toBeTruthy();
    expect(isDialogOpen()).toBe(false);
  });

  it('opens the inline confirmation dialog on Disable, naming the target by handle', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

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

    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={disabledUser} />);

    expect(isDialogOpen()).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enable account' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/u1/enable', { method: 'POST' });
    expect(isDialogOpen()).toBe(false);
  });

  it('calls the disable endpoint and reflects the new status only on Confirm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ...BASE_USER, status: 'disabled' }), { status: 200 }),
      ),
    );

    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disable @follower' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/users/u1/disable', { method: 'POST' });
    expect(screen.getByText('disabled')).toBeTruthy();
    // Dialog closes once the action lands.
    expect(isDialogOpen()).toBe(false);
  });

  it('does not call the API when the dialog is cancelled', () => {
    vi.stubGlobal('fetch', vi.fn());

    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(isDialogOpen()).toBe(false);
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

    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disable @follower' }));
    });

    expect(screen.getByRole('alert').textContent).toBe('You cannot disable your own account.');
    // Status is unchanged - the guard refused the action.
    expect(screen.getByText('active')).toBeTruthy();
  });

  it('shows a View as button for a non-admin target', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    expect(screen.getByRole('button', { name: 'View as @follower' })).toBeTruthy();
  });

  it('never shows View as for a target who is an admin', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={{ ...BASE_USER, user_group: 'admin' }} />);

    expect(screen.queryByRole('button', { name: /View as/ })).toBeNull();
  });

  it('shows the impersonation-expired message when landed here with that param', () => {
    render(
      <AdminUserDetailView
        currentAdminId="admin-1"
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
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} impersonationExpired />);

    expect(screen.getByText('Your view-as session expired.')).toBeTruthy();
  });

  it('shows a warning, not a clean "you are back", when the stop call could not confirm the session ended', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} impersonationStopWarning />);

    expect(screen.getByText(/Could not confirm the view-as session ended/)).toBeTruthy();
  });

  it('shows no expiry message on a normal visit', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    expect(screen.queryByText(/view-as session/)).toBeNull();
  });

  it('hides Disable/Enable on the admin’s own row - the server always refuses it, same as View-as', () => {
    render(<AdminUserDetailView currentAdminId="u1" initialUser={BASE_USER} />);

    expect(screen.queryByRole('button', { name: 'Disable account' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Enable account/ })).toBeNull();
  });

  it('still shows View as being absent and Disable being absent together on an admin’s own row', () => {
    render(
      <AdminUserDetailView
        currentAdminId="u1"
        initialUser={{ ...BASE_USER, user_group: 'admin' }}
      />,
    );

    expect(screen.queryByRole('button', { name: /View as/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Disable account' })).toBeNull();
  });

  it('shows an admin badge for an admin target', () => {
    render(
      <AdminUserDetailView
        currentAdminId="admin-1"
        initialUser={{ ...BASE_USER, user_group: 'admin' }}
      />,
    );

    expect(screen.getByText('admin')).toBeTruthy();
  });

  it('shows the user id, copyable', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    expect(screen.getByTitle('Copy user ID').textContent).toContain('u1');
  });

  it('gives the confirmation dialog role="dialog" semantics and moves focus into it', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    expect(isDialogOpen()).toBe(true);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('dismisses the dialog on Escape, same as any native dialog', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));
    expect(isDialogOpen()).toBe(true);

    // The native dialog's own `close` event is what Escape triggers in a
    // real browser (jsdom/happy-dom do not simulate the platform key
    // handling) - firing it here exercises the same onClose handler that
    // keeps `confirming` state in sync with the dialog actually closing.
    fireEvent(document.querySelector('dialog')!, new Event('close'));

    expect(isDialogOpen()).toBe(false);
  });

  it('does not change the confirmation copy - only the dialog semantics around it', () => {
    render(<AdminUserDetailView currentAdminId="admin-1" initialUser={BASE_USER} />);

    fireEvent.click(screen.getByRole('button', { name: 'Disable account' }));

    expect(
      screen.getByText(
        /Disabling.*signs them out immediately and they cannot sign in again until re-enabled/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/restored on re-enable/)).toBeTruthy();
  });
});
