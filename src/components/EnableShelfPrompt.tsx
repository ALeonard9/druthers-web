'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHELVES, type ShelfId } from '@/lib/duelShelves';
import type { ShelfPreferences } from '@/lib/shelfPreferences';
import { saveShelfPreferences } from '@/lib/shelfPreferencesClient';

export function EnableShelfPrompt({
  shelf,
  destination,
  preferences,
}: {
  shelf: ShelfId;
  destination: string;
  preferences: ShelfPreferences;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = SHELVES[shelf].label;

  async function enable() {
    setSaving(true);
    setError(null);
    try {
      await saveShelfPreferences({
        order: preferences.order,
        enabled: [...new Set([...preferences.enabled, shelf])],
      });
      router.replace(destination);
    } catch {
      setError(`Could not enable ${label}. Try again.`);
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-xl border border-line bg-panel p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-brass">Shelf turned off</p>
        <h1 className="font-display text-3xl text-paper">Enable {label}?</h1>
        <p className="text-sm text-neutral-400">
          This page belongs to your {label} shelf. Turn it on to continue where you were going.
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void enable()}
          className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          {saving ? `Enabling ${label}...` : `Enable ${label}`}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => router.replace('/settings#shelves')}
          className="rounded border border-line px-4 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
        >
          Back to Shelf Settings
        </button>
      </div>
    </section>
  );
}
