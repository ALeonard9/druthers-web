/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAccount } from './DeleteAccount';

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

describe('DeleteAccount', () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('requires the typed confirmation before it can call the delete endpoint', () => {
    render(<DeleteAccount />);

    const button = screen.getByRole('button', { name: 'Delete account' });
    expect(button.getAttribute('disabled')).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'delete' } });
    expect(button.getAttribute('disabled')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'DELETE' } });
    expect(button.getAttribute('disabled')).toBeNull();
  });

  it('shows the API error and keeps the current session in place when deletion is rejected', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'Account has active billing' }), { status: 409 }));
    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Account has active billing');
    expect(fetch).toHaveBeenCalledWith('/api/account', { method: 'DELETE' });
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(navigation.refresh).not.toHaveBeenCalled();
  });

  it('leaves the session-clearing endpoint and returns to the public landing page on success', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/'));
    expect(navigation.refresh).toHaveBeenCalledOnce();
  });
});
