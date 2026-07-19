'use client';

// The date an item was finished. Defaults server-side to the day it entered
// Rankings; this field makes it configurable on the detail page (the old
// site's g_first, restored in the cutover recovery).
export function CompletedDateField({
  value,
  disabled,
  onSave,
}: {
  value: string | null;
  disabled: boolean;
  onSave: (date: string | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
        Completed
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onSave(e.target.value || null)}
          disabled={disabled}
          className="rounded border border-neutral-700 bg-night px-3 py-1.5 text-sm outline-none [color-scheme:dark] focus:border-brass disabled:opacity-50"
        />
        {value && (
          <button
            type="button"
            onClick={() => onSave(null)}
            disabled={disabled}
            className="text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
