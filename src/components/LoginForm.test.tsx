/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
}));

describe('LoginForm', () => {
  beforeEach(() => navigation.replace.mockReset());

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('uses a client transition after local sign-in succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'change-me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev@example.com', password: 'change-me' }),
    });
    expect(screen.getByRole('button', { name: 'Signing in…' })).toHaveProperty('disabled', true);
  });
});
