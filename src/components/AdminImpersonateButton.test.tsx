/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminImpersonateButton } from './AdminImpersonateButton';

describe('AdminImpersonateButton', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('starts a view-as session with no confirmation and navigates home', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<AdminImpersonateButton userId="u1" handle="follower" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View as @follower' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_uuid: 'u1' }),
    });
    expect(assign).toHaveBeenCalledWith('/');
  });

  it('surfaces the guard error (e.g. cannot impersonate an admin) instead of a generic failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Cannot impersonate another admin.' }), {
          status: 403,
        }),
      ),
    );

    render(<AdminImpersonateButton userId="u2" handle="another-admin" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'View as @another-admin' }));
    });

    expect(screen.getByRole('alert').textContent).toBe('Cannot impersonate another admin.');
  });
});
