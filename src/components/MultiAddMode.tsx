'use client';

import { createContext, useContext, useState } from 'react';

const MultiAddModeContext = createContext(false);

export function useMultiAddMode() {
  return useContext(MultiAddModeContext);
}

export function MultiAddMode({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  return (
    <MultiAddModeContext.Provider value={enabled}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-paper">Keep adding</p>
            <p className="text-xs text-neutral-400">
              Add several titles without leaving these results.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Keep adding without leaving results"
            aria-checked={enabled}
            onClick={() => setEnabled((current) => !current)}
            className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
              enabled
                ? 'border-moss bg-moss'
                : 'border-neutral-600 bg-neutral-700 hover:border-brass/60'
            }`}
          >
            <span
              aria-hidden="true"
              className={`block h-5 w-5 rounded-full bg-paper shadow-sm transition-transform motion-reduce:transition-none ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {children}
      </div>
    </MultiAddModeContext.Provider>
  );
}
