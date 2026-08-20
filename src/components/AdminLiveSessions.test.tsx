/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminLiveSessions } from './AdminLiveSessions';
import type { AdminLiveSession } from '@/lib/types';

const SESSION: AdminLiveSession = {
  session_id: 's1',
  acting_admin: { id: 'a1', handle: 'adam', display_name: null, email: 'admin@example.com' },
  target: { id: 't1', handle: 'follower', display_name: 'Follower', email: 'follower@example.com' },
  started_at: '2026-08-19T12:00:00Z',
  expires_at: '2026-08-19T12:15:00Z',
};

describe('AdminLiveSessions', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('answers "no one is currently viewing as anyone" with no live sessions', () => {
    render(<AdminLiveSessions initialSessions={[]} />);

    expect(screen.getByText('No one is currently viewing as anyone.')).toBeTruthy();
  });

  it('shows who is viewing as whom', () => {
    render(<AdminLiveSessions initialSessions={[SESSION]} />);

    expect(screen.getByText('@adam')).toBeTruthy();
    expect(screen.getByText('@follower')).toBeTruthy();
  });

  it('revokes a session by id and removes it from the list on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ended: 1 }))));

    render(<AdminLiveSessions initialSessions={[SESSION]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End session' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/impersonation/s1', { method: 'DELETE' });
    expect(screen.getByText('No one is currently viewing as anyone.')).toBeTruthy();
  });

  it('surfaces an error rather than silently leaving the row if revoke fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'boom' }), { status: 500 })),
    );

    render(<AdminLiveSessions initialSessions={[SESSION]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'End session' }));
    });

    expect(screen.getByRole('alert').textContent).toBe('boom');
    // Row stays - the revoke did not actually succeed.
    expect(screen.getByText('@follower')).toBeTruthy();
  });
});
