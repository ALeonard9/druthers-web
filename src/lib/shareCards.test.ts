import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSiteUrl, getBaseDomain, profileUrl } from './shareCards';

describe('shareCards environment domain resolution (#155)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses NEXT_PUBLIC_SITE_URL when provided', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://qa.druthers.io';
    expect(getSiteUrl()).toBe('https://qa.druthers.io');
    expect(getBaseDomain()).toBe('qa.druthers.io');
    expect(profileUrl('testuser')).toBe('https://qa.druthers.io/u/testuser');
  });

  it('falls back to dev localhost when NEXT_PUBLIC_APP_ENV is dev', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_APP_ENV = 'dev';
    expect(getSiteUrl()).toBe('http://localhost:3000');
    expect(getBaseDomain()).toBe('localhost:3000');
    expect(profileUrl('alice')).toBe('http://localhost:3000/u/alice');
  });

  it('falls back to default production URL when no env or window origin exists', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    expect(getSiteUrl()).toBe('https://www.druthers.io');
    expect(getBaseDomain()).toBe('www.druthers.io');
    expect(profileUrl('bob')).toBe('https://www.druthers.io/u/bob');
  });
});
