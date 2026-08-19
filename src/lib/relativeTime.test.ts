import { describe, expect, it } from 'vitest';
import { relativeTimeFrom, exactTimestamp } from './relativeTime';

const NOW = new Date('2026-08-18T12:00:00Z');

describe('relativeTimeFrom', () => {
  it('reads sub-minute gaps as "just now"', () => {
    expect(relativeTimeFrom('2026-08-18T11:59:45Z', NOW)).toBe('just now');
  });

  it('reads minutes', () => {
    expect(relativeTimeFrom('2026-08-18T11:55:00Z', NOW)).toBe('5m ago');
  });

  it('reads hours', () => {
    expect(relativeTimeFrom('2026-08-18T09:00:00Z', NOW)).toBe('3h ago');
  });

  it('reads days', () => {
    expect(relativeTimeFrom('2026-08-15T12:00:00Z', NOW)).toBe('3d ago');
  });

  it('reads months', () => {
    expect(relativeTimeFrom('2026-06-01T12:00:00Z', NOW)).toBe('2mo ago');
  });

  it('reads years', () => {
    expect(relativeTimeFrom('2024-08-18T12:00:00Z', NOW)).toBe('2y ago');
  });

  it('falls back to the raw string for an unparseable value', () => {
    expect(relativeTimeFrom('not-a-date', NOW)).toBe('not-a-date');
  });
});

describe('exactTimestamp', () => {
  it('formats a real date', () => {
    expect(exactTimestamp('2026-08-18T12:00:00Z')).not.toBe('2026-08-18T12:00:00Z');
  });

  it('falls back to the raw string for an unparseable value', () => {
    expect(exactTimestamp('not-a-date')).toBe('not-a-date');
  });
});
