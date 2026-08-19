/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImpersonationEscapeButton } from './ImpersonationEscapeButton';

describe('ImpersonationEscapeButton', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('calls the stop endpoint and does a clean navigation when the session confirms ended', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, sessionEnded: true }))),
    );
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<ImpersonationEscapeButton targetId="target-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to admin' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/impersonation', { method: 'DELETE' });
    expect(assign).toHaveBeenCalledWith('/admin/users/target-1');
  });

  it('still navigates away locally when the stop call cannot confirm the session ended, but flags it', async () => {
    // The local cookies are always cleared by the route handler regardless -
    // this must not read as a clean "you are back", so the destination
    // carries the warning param the detail page surfaces.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, sessionEnded: false, warning: 'refused' })),
      ),
    );
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<ImpersonationEscapeButton targetId="target-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to admin' }));
    });

    expect(assign).toHaveBeenCalledWith('/admin/users/target-1?impersonation_stop_warning=1');
  });

  it('still navigates away, flagged as unconfirmed, if the stop call fails outright - the escape hatch must always work locally', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<ImpersonationEscapeButton targetId="target-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to admin' }));
    });

    expect(assign).toHaveBeenCalledWith('/admin/users/target-1?impersonation_stop_warning=1');
  });

  it('supports a custom label for the /admin block screen', () => {
    render(<ImpersonationEscapeButton targetId="target-1" label="Return to admin" />);

    expect(screen.getByRole('button', { name: 'Return to admin' })).toBeTruthy();
  });
});
