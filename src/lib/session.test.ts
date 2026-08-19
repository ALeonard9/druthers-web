import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_META_COOKIE,
  SESSION_COOKIE,
} from './sessionCookies';

const mocks = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));

const { getImpersonationMeta, getToken } = await import('./session');

function fakeCookieStore(values: Record<string, string>) {
  return {
    get: (name: string) => (name in values ? { value: values[name] } : undefined),
  };
}

describe('getToken', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses the regular session cookie with no impersonation active', async () => {
    mocks.cookies.mockResolvedValue(fakeCookieStore({ [SESSION_COOKIE]: 'admin-jwt' }));

    expect(await getToken()).toBe('admin-jwt');
  });

  it('prefers the impersonation cookie whenever it is present', async () => {
    // This is the one source of truth the whole feature depends on (#250):
    // every apiFetch call and the admin gate itself all resolve identity
    // through this same function, so there is nowhere for them to disagree.
    mocks.cookies.mockResolvedValue(
      fakeCookieStore({ [SESSION_COOKIE]: 'admin-jwt', [IMPERSONATION_COOKIE]: 'view-as-jwt' }),
    );

    expect(await getToken()).toBe('view-as-jwt');
  });
});

describe('getImpersonationMeta', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is null with no impersonation cookie', async () => {
    mocks.cookies.mockResolvedValue(fakeCookieStore({}));

    expect(await getImpersonationMeta()).toBeNull();
  });

  it('parses the metadata cookie', async () => {
    const meta = {
      session_id: 's1',
      expires_at: '2026-08-19T12:15:00Z',
      target: { id: 't1', handle: 'private-user', display_name: null, email: 'p@example.com' },
      acting_admin: { id: 'a1', handle: 'adam', email: 'admin@example.com' },
    };
    mocks.cookies.mockResolvedValue(
      fakeCookieStore({ [IMPERSONATION_META_COOKIE]: JSON.stringify(meta) }),
    );

    expect(await getImpersonationMeta()).toEqual(meta);
  });

  it('is null for unparseable cookie content rather than throwing', async () => {
    mocks.cookies.mockResolvedValue(
      fakeCookieStore({ [IMPERSONATION_META_COOKIE]: 'not-json' }),
    );

    expect(await getImpersonationMeta()).toBeNull();
  });
});
