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

// Which sound plays when something is marked watched/read/played.
// Stored per-device (localStorage). Lives on /settings.
export function SoundPicker() {
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
  );
}
