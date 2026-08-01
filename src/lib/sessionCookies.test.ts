import { describe, it, expect } from 'vitest';
import {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  applyTokenCookies,
  clearSessionCookies,
  type TokenResponse,
} from './sessionCookies';

interface Written {
  value: string;
  options?: Record<string, unknown>;
}

function fakeStore() {
  const written = new Map<string, Written>();
  const deleted: string[] = [];
  return {
    written,
    deleted,
    set(name: string, value: string, options?: Record<string, unknown>) {
      written.set(name, { value, options });
    },
    delete(name: string) {
      deleted.push(name);
      written.delete(name);
    },
  };
}

const tokens: TokenResponse = {
  access_token: 'access-abc',
  refresh_token: 'drr_refresh-abc',
  expires_in: 1800,
  refresh_expires_in: 2592000,
  user_id: 'user-1',
  email: 'adam@example.com',
  user_group: 'user',
};

describe('applyTokenCookies', () => {
  it('stores the access and refresh tokens httpOnly', () => {
    const store = fakeStore();
    applyTokenCookies(store, tokens);

    expect(store.written.get(SESSION_COOKIE)?.value).toBe('access-abc');
    expect(store.written.get(SESSION_COOKIE)?.options?.httpOnly).toBe(true);
    expect(store.written.get(REFRESH_COOKIE)?.value).toBe('drr_refresh-abc');
    expect(store.written.get(REFRESH_COOKIE)?.options?.httpOnly).toBe(true);
  });

  it('leaves the user cookie readable for the nav', () => {
    const store = fakeStore();
    const user = applyTokenCookies(store, tokens);

    expect(user.email).toBe('adam@example.com');
    const cookie = store.written.get(USER_COOKIE);
    expect(cookie?.options?.httpOnly).toBe(false);
    expect(JSON.parse(cookie!.value)).toEqual({
      user_id: 'user-1',
      email: 'adam@example.com',
      user_group: 'user',
    });
  });

  it('retires the session cookie before its token expires', () => {
    // The margin is what lets middleware refresh on a missing cookie rather
    // than on a 401 from a token that died in flight.
    const store = fakeStore();
    applyTokenCookies(store, tokens);

    const maxAge = store.written.get(SESSION_COOKIE)?.options?.maxAge as number;
    expect(maxAge).toBeLessThan(tokens.expires_in);
    expect(maxAge).toBe(1740);
  });

  it('never gives the session cookie a floor of zero or less', () => {
    const store = fakeStore();
    applyTokenCookies(store, { ...tokens, expires_in: 30 });

    expect(store.written.get(SESSION_COOKIE)?.options?.maxAge).toBe(60);
  });

  it('keeps the refresh and user cookies alive for the full refresh window', () => {
    // The user cookie is the "you are signed in" hint; expiring it with the
    // access token would blank the nav every half hour.
    const store = fakeStore();
    applyTokenCookies(store, tokens);

    expect(store.written.get(REFRESH_COOKIE)?.options?.maxAge).toBe(2592000);
    expect(store.written.get(USER_COOKIE)?.options?.maxAge).toBe(2592000);
  });

  it('sizes cookies from the response, not from hardcoded constants', () => {
    const store = fakeStore();
    applyTokenCookies(store, {
      ...tokens,
      expires_in: 3600,
      refresh_expires_in: 604800,
    });

    expect(store.written.get(SESSION_COOKIE)?.options?.maxAge).toBe(3540);
    expect(store.written.get(REFRESH_COOKIE)?.options?.maxAge).toBe(604800);
  });
});

describe('clearSessionCookies', () => {
  it('drops every session cookie, refresh token included', () => {
    const store = fakeStore();
    applyTokenCookies(store, tokens);
    clearSessionCookies(store);

    expect(store.deleted).toEqual([SESSION_COOKIE, REFRESH_COOKIE, USER_COOKIE]);
    expect(store.written.size).toBe(0);
  });
});
