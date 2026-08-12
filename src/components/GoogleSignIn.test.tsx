/** @vitest-environment happy-dom */
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleSignIn } from './GoogleSignIn';

const navigation = vi.hoisted(() => ({
  pathname: '/',
  refreshAuthState: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
}));
vi.mock('@/app/authActions', () => ({ refreshAuthState: navigation.refreshAuthState }));

describe('GoogleSignIn', () => {
  let credentialCallback: (response: { credential: string }) => void;

  beforeEach(() => {
    navigation.pathname = '/';
    navigation.refreshAuthState.mockReset().mockResolvedValue(undefined);
    navigation.replace.mockReset();
    window.google = {
      accounts: {
        id: {
          initialize: ({ callback }) => {
            credentialCallback = callback;
          },
          renderButton: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    cleanup();
    delete window.google;
    vi.unstubAllGlobals();
  });

  async function submitCredential(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    render(<GoogleSignIn clientId="google-client" />);
    await waitFor(() => expect(credentialCallback).toBeTypeOf('function'));

    await act(async () => credentialCallback({ credential: 'google-id-token' }));
    return fetchMock;
  }

  it('refreshes the public homepage shell in place after it establishes the session', async () => {
    const fetchMock = await submitCredential(Response.json({ ok: true }));

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'google-id-token' }),
    });
    expect(navigation.refreshAuthState).toHaveBeenCalledOnce();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.getByText('Signing in...')).toBeTruthy();
  });

  it('refreshes the shared shell before transitioning from the dedicated login page', async () => {
    navigation.pathname = '/login';
    await submitCredential(Response.json({ ok: true }));

    expect(navigation.refreshAuthState).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith('/');
    expect(navigation.refreshAuthState.mock.invocationCallOrder[0]).toBeLessThan(
      navigation.replace.mock.invocationCallOrder[0],
    );
  });

  it('restores the button and reports an API rejection', async () => {
    await submitCredential(Response.json({ error: 'Account is disabled' }, { status: 401 }));

    expect(screen.getByText('Account is disabled')).toBeTruthy();
    expect(screen.queryByText('Signing in...')).toBeNull();
    expect(navigation.refreshAuthState).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
