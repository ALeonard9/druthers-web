'use client';

import { useEffect, useState } from 'react';
import type { Preferences } from '@/lib/types';
import { greetingAt, FALLBACK_TIME_ZONE } from '@/lib/viewerTime';
import { deviceTimeZone } from '@/lib/deviceTimeZone';

// Zones offered when the browser cannot enumerate the tzdb itself. Small on
// purpose - it is a floor, not a catalogue, and every current browser takes
// the Intl.supportedValuesOf path above it.
const FALLBACK_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function knownZones(): string[] {
  const supported = Intl.supportedValuesOf;
  if (typeof supported === 'function') {
    try {
      return supported('timeZone');
    } catch {
      /* fall through */
    }
  }
  return FALLBACK_ZONES;
}

/**
 * Choose the zone this account's own hours are read in - the greeting, and
 * which day the schedule calls today. Saved to the account, not the device,
 * so it follows you to a phone.
 */
export function TimeZonePicker() {
  const [zone, setZone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Both the zone and the clock land after mount, in the same update.
    // Reading the clock during render would put SSR and hydration at two
    // different instants; setting it in the effect body rather than in this
    // callback is a second render for no reason.
    fetch('/api/preferences')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Load failed'))))
      .then((prefs: Preferences) => {
        if (cancelled) return;
        setZone(prefs.time_zone ?? FALLBACK_TIME_ZONE);
        setNow(new Date());
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your time zone.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: string) {
    const previous = zone;
    setZone(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_zone: next }),
      });
      if (!res.ok) throw new Error('Save failed');
      const prefs: Preferences = await res.json();
      setZone(prefs.time_zone);
    } catch {
      // Put the old value back rather than leaving the control showing a
      // choice the server never accepted.
      setZone(previous);
      setError('Could not save that time zone.');
    } finally {
      setSaving(false);
    }
  }

  if (zone === null) {
    return (
      <p className="rounded-lg border border-line bg-panel p-4 text-sm text-neutral-400">
        {error ?? 'Loading…'}
      </p>
    );
  }

  const device = deviceTimeZone();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4">
      <label className="flex flex-col gap-1.5 text-sm text-neutral-200">
        Time zone
        <select
          value={zone}
          disabled={saving}
          onChange={(e) => save(e.target.value)}
          className="rounded border border-neutral-700 bg-night px-3 py-2 text-sm text-paper outline-none focus:border-brass disabled:opacity-60"
        >
          {/* A zone the browser cannot enumerate is still the saved value -
              keep it selectable so saving something else stays possible. */}
          {!knownZones().includes(zone) && <option value={zone}>{zone}</option>}
          {knownZones().map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs text-neutral-500">
        {now ? (
          <>
            It&apos;s{' '}
            <span className="text-neutral-300">
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                weekday: 'short',
                timeZone: zone,
              }).format(now)}
            </span>{' '}
            there - {greetingAt(now, zone).toLowerCase()}.
          </>
        ) : (
          ' '
        )}
      </p>

      {device !== zone && (
        <button
          type="button"
          onClick={() => save(device)}
          disabled={saving}
          className="self-start rounded bg-line px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-60"
        >
          Use this device&apos;s zone ({device.replace(/_/g, ' ')})
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
