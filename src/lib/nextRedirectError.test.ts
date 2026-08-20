import { describe, expect, it } from 'vitest';
import { isNextRedirectError } from './nextRedirectError';

describe('isNextRedirectError', () => {
  it('is true for an error carrying a NEXT_REDIRECT digest', () => {
    const err = Object.assign(new Error('redirect'), { digest: 'NEXT_REDIRECT;push;/login;307;' });
    expect(isNextRedirectError(err)).toBe(true);
  });

  it('is false for a plain error', () => {
    expect(isNextRedirectError(new Error('boom'))).toBe(false);
  });

  it('is false for an error with an unrelated digest', () => {
    const err = Object.assign(new Error('not found'), { digest: 'NEXT_NOT_FOUND' });
    expect(isNextRedirectError(err)).toBe(false);
  });

  it('is false for non-object values', () => {
    expect(isNextRedirectError('boom')).toBe(false);
    expect(isNextRedirectError(null)).toBe(false);
    expect(isNextRedirectError(undefined)).toBe(false);
  });
});
