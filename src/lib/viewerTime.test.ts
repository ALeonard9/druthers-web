import { describe, expect, it } from 'vitest';
import {
  FALLBACK_TIME_ZONE,
  dayIn,
  greetingAt,
  hourIn,
  relativeDayLabel,
} from './viewerTime';

// 2026-08-10T02:30:00Z - deliberately after UTC midnight, so a zone behind
// UTC is still on the 9th and a zone ahead is well into the 10th. Anything
// that reads the server's clock instead of the viewer's gets this wrong.
const AT = new Date('2026-08-10T02:30:00Z');

describe('hourIn', () => {
  it('reads the hour in the given zone, not the runtime default', () => {
    expect(hourIn(AT, 'UTC')).toBe(2);
    expect(hourIn(AT, 'America/Chicago')).toBe(21);
    expect(hourIn(AT, 'Asia/Tokyo')).toBe(11);
    expect(hourIn(AT, 'Australia/Sydney')).toBe(12);
  });

  it('falls back instead of throwing on a zone Intl does not know', () => {
    expect(hourIn(AT, 'Mars/Olympus_Mons')).toBe(hourIn(AT, FALLBACK_TIME_ZONE));
  });
});

describe('greetingAt', () => {
  it('greets each seat by its own clock at one instant', () => {
    expect(greetingAt(AT, 'America/Chicago')).toBe('Good evening'); // 21:30
    expect(greetingAt(AT, 'Asia/Tokyo')).toBe('Good morning'); // 11:30
    expect(greetingAt(AT, 'Australia/Sydney')).toBe('Good afternoon'); // 12:30
    expect(greetingAt(AT, 'UTC')).toBe('Up late'); // 02:30
  });

  it('turns over at 05:00, 12:00 and 17:00 local', () => {
    const at = (hhmm: string) => new Date(`2026-08-10T${hhmm}:00Z`);
    expect(greetingAt(at('04:59'), 'UTC')).toBe('Up late');
    expect(greetingAt(at('05:00'), 'UTC')).toBe('Good morning');
    expect(greetingAt(at('11:59'), 'UTC')).toBe('Good morning');
    expect(greetingAt(at('12:00'), 'UTC')).toBe('Good afternoon');
    expect(greetingAt(at('16:59'), 'UTC')).toBe('Good afternoon');
    expect(greetingAt(at('17:00'), 'UTC')).toBe('Good evening');
  });
});

describe('dayIn', () => {
  it('puts zones on either side of UTC midnight on different dates', () => {
    expect(dayIn(AT, 'UTC')).toBe('2026-08-10');
    expect(dayIn(AT, 'America/Chicago')).toBe('2026-08-09');
    expect(dayIn(AT, 'Asia/Tokyo')).toBe('2026-08-10');
  });
});

describe('relativeDayLabel', () => {
  it('labels the viewer’s own today, not the server’s', () => {
    expect(relativeDayLabel('2026-08-09', AT, 'America/Chicago')).toBe('Today');
    expect(relativeDayLabel('2026-08-10', AT, 'America/Chicago')).toBe('Tomorrow');
    expect(relativeDayLabel('2026-08-08', AT, 'America/Chicago')).toBe('Yesterday');
    // Same instant, same date string, different seat: the 10th is *today* in
    // Tokyo while it is still tomorrow in Chicago.
    expect(relativeDayLabel('2026-08-10', AT, 'Asia/Tokyo')).toBe('Today');
  });

  it('returns null for anything outside the ±1 day window', () => {
    expect(relativeDayLabel('2026-08-12', AT, 'UTC')).toBeNull();
    expect(relativeDayLabel('2026-08-07', AT, 'UTC')).toBeNull();
  });

  it('steps the calendar across a month boundary', () => {
    const eom = new Date('2026-08-31T18:00:00Z');
    expect(relativeDayLabel('2026-09-01', eom, 'UTC')).toBe('Tomorrow');
    expect(relativeDayLabel('2026-08-30', eom, 'UTC')).toBe('Yesterday');
  });

  it('steps the calendar across a DST turnover, where +24h would not', () => {
    // US DST ends 2026-11-01; that local day is 25 hours long, so adding
    // 86_400_000ms to 23:30 on Oct 31 lands back on Nov 1 *twice*.
    const beforeFallBack = new Date('2026-11-01T04:30:00Z'); // 23:30 Oct 31 CDT
    expect(relativeDayLabel('2026-10-31', beforeFallBack, 'America/Chicago')).toBe(
      'Today',
    );
    expect(relativeDayLabel('2026-11-01', beforeFallBack, 'America/Chicago')).toBe(
      'Tomorrow',
    );
  });
});
