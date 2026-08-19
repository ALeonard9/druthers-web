/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImpersonationEscapeButton } from './ImpersonationEscapeButton';

describe('ImpersonationEscapeButton', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('calls the stop endpoint and does a full navigation back to the target detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<ImpersonationEscapeButton targetId="target-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to admin' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/impersonation', { method: 'DELETE' });
    expect(assign).toHaveBeenCalledWith('/admin/users/target-1');
  });

  it('still navigates away even if the stop call fails - the escape hatch must always work', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<ImpersonationEscapeButton targetId="target-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to admin' }));
    });

    expect(assign).toHaveBeenCalledWith('/admin/users/target-1');
  });

  it('supports a custom label for the /admin block screen', () => {
    render(<ImpersonationEscapeButton targetId="target-1" label="Return to admin" />);

    expect(screen.getByRole('button', { name: 'Return to admin' })).toBeTruthy();
  });
});
