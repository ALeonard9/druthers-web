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
  const selected = SOUND_CHOICES.find((s) => s.id === choice) ?? SOUND_CHOICES[0];

  function pick(id: string) {
    setSoundChoice(id);
    playSound(id);
  }

  return (
    <div suppressHydrationWarning className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-panel p-4">
        <span className="flex-1 text-sm text-neutral-200">
          {selected.name}
          <span className="block text-xs text-neutral-500">{selected.hint}</span>
        </span>
        {selected.id !== 'none' && (
          <button
            onClick={() => playSound(selected.id)}
            aria-label={`Preview ${selected.name}`}
            className="shrink-0 rounded bg-line px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
          >
            ▶
          </button>
        )}
      </div>

      <details className="rounded-lg border border-line bg-panel">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-neutral-200 hover:text-brass-bright">
          Other sounds
        </summary>
        <ul className="divide-y divide-line/60 border-t border-line">
          {SOUND_CHOICES.map((s) => {
            const active = choice === s.id;
            return (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => pick(s.id)}
                  aria-pressed={active}
                  className={`flex-1 text-left text-sm ${
                    active ? 'text-paper' : 'text-neutral-300'
                  }`}
                >
                  {s.name}
                  <span className="block text-xs text-neutral-500">{s.hint}</span>
                </button>
                {active && (
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
      </details>
    </div>
  );
}
