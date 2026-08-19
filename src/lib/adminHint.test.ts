import { describe, expect, it } from 'vitest';
import { isAdminHint } from './adminHint';

describe('isAdminHint', () => {
  it('is false with no session', () => {
    expect(isAdminHint(null)).toBe(false);
  });

  it('is false for a non-admin user_group', () => {
    expect(isAdminHint({ user_id: '1', email: 'a@example.com', user_group: 'user' })).toBe(
      false,
    );
  });

  it('is true only for user_group "admin" - this drives rendering only, never authorization', () => {
    expect(isAdminHint({ user_id: '1', email: 'a@example.com', user_group: 'admin' })).toBe(
      true,
    );
  });
});
