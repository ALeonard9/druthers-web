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

  // Regression pin: the API used to omit the Z designator, which made
  // `new Date(iso)` parse the timestamp in the *runner's* local zone instead
  // of UTC. In America/Chicago that made anything under 5 hours old read
  // "just now" and 3-day-old timestamps read "2d ago". Fixed at the API
  // source, but this pins the Z-suffixed math here too so a regression in
  // either layer gets caught.
  it('computes an absolute duration off a Z-suffixed timestamp regardless of local zone', () => {
    expect(relativeTimeFrom('2026-08-18T07:00:00Z', NOW)).toBe('5h ago');
    expect(relativeTimeFrom('2026-08-15T13:00:00Z', NOW)).toBe('2d ago');
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
