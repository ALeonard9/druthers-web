/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

const mocks = vi.hoisted(() => ({
  refreshAuthState: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/app/authActions', () => ({ refreshAuthState: mocks.refreshAuthState }));

describe('LoginForm', () => {
  beforeEach(() => {
    mocks.refreshAuthState.mockReset().mockResolvedValue(undefined);
    mocks.replace.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('refreshes the shared shell before the client transition after local sign-in', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'change-me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev@example.com', password: 'change-me' }),
    });
    expect(mocks.refreshAuthState).toHaveBeenCalledOnce();
    expect(mocks.refreshAuthState.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.replace.mock.invocationCallOrder[0],
    );
    expect(screen.getByRole('button', { name: 'Signing in…' })).toHaveProperty('disabled', true);
  });
});
