/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '@/lib/types';
import { AppShell } from './AppShell';
import { GoogleSignIn } from './GoogleSignIn';
import { LoginForm } from './LoginForm';

const mocks = vi.hoisted(() => ({
  pathname: '/login',
  refreshAuthState: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/app/authActions', () => ({ refreshAuthState: mocks.refreshAuthState }));
vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav aria-label="Sidebar navigation" />,
  BottomTabs: () => <nav aria-label="Bottom tabs" />,
}));
vi.mock('@/components/TopBar', () => ({
  TopBar: ({ user }: { user: SessionUser }) => (
    <header aria-label="Top bar">Signed in as {user.email}</header>
  ),
}));
vi.mock('@/components/RefreshHomeOnReturn', () => ({
  RefreshHomeOnReturn: () => null,
}));

const signedInUser: SessionUser = {
  user_id: 'viewer',
  email: 'viewer@example.com',
  user_group: 'user',
};

describe('AppShell after sign-in', () => {
  let credentialCallback: (response: { credential: string }) => void;

  beforeEach(() => {
    mocks.pathname = '/login';
    mocks.refreshAuthState.mockReset();
    mocks.replace.mockReset();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    cleanup();
    delete window.google;
    vi.unstubAllGlobals();
  });

  function expectSignedInChrome() {
    expect(screen.getByRole('navigation', { name: 'Sidebar navigation' })).toBeTruthy();
    expect(screen.getByRole('banner', { name: 'Top bar' }).textContent).toContain(
      'viewer@example.com',
    );
    expect(screen.getByRole('navigation', { name: 'Bottom tabs' })).toBeTruthy();
  }

  it('renders signed-in chrome after a successful local sign-in from /login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true })));
    const view = render(
      <AppShell user={null}>
        <LoginForm />
      </AppShell>,
    );
    mocks.refreshAuthState.mockImplementation(async () => {
      view.rerender(
        <AppShell user={signedInUser}>
          <p>Home content</p>
        </AppShell>,
      );
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'viewer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'change-me' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(expectSignedInChrome);
  });

  it('renders signed-in chrome after a successful Google sign-in from /', async () => {
    mocks.pathname = '/';
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: true })));
    const view = render(
      <AppShell user={null}>
        <GoogleSignIn clientId="google-client" />
      </AppShell>,
    );
    mocks.refreshAuthState.mockImplementation(async () => {
      view.rerender(
        <AppShell user={signedInUser}>
          <p>Home content</p>
        </AppShell>,
      );
    });
    await waitFor(() => expect(credentialCallback).toBeTypeOf('function'));

    await act(async () => credentialCallback({ credential: 'google-id-token' }));

    await waitFor(expectSignedInChrome);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
