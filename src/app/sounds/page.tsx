'use client';

import { useSyncExternalStore } from 'react';
import {
  DEFAULT_SOUND,
  SOUND_CHOICES,
  getSoundChoice,
  playSound,
  setSoundChoice,
  subscribeSoundChoice,
} from '@/lib/pop';

// Sound setting: which sound plays when something is marked watched/done.
// Stored per-device (localStorage).
export default function SoundsPage() {
  const choice = useSyncExternalStore(
    subscribeSoundChoice,
    getSoundChoice,
    () => DEFAULT_SOUND,
  );

  function pick(id: string) {
    setSoundChoice(id);
    playSound(id);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Sound
        </h1>
        <p className="text-sm text-neutral-400">
          Played when you mark something watched, read, or played. Saved on
          this device.
        </p>
      </div>
      <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
        {SOUND_CHOICES.map((s) => {
          const selected = choice === s.id;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              <button
                onClick={() => pick(s.id)}
                aria-pressed={selected}
                className={`flex-1 text-left text-sm ${
                  selected ? 'text-paper' : 'text-neutral-300'
                }`}
              >
                {s.name}
                <span className="block text-xs text-neutral-500">{s.hint}</span>
              </button>
              {selected && (
                <span className="shrink-0 rounded bg-moss-wash px-2 py-1 text-xs font-medium text-moss">
                  ✓ In use
                </span>
              )}
              {s.id !== 'none' && (
                <button
                  onClick={() => playSound(s.id)}
                  aria-label={`Preview ${s.name}`}
                  className="shrink-0 rounded bg-line px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
                >
                  ▶
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
