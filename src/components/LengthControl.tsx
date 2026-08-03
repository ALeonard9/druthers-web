import type { RankedListLength } from '@/lib/types';

const OPTIONS: { value: RankedListLength; label: string }[] = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: 'all', label: 'All' },
];

// 25/50/100/All (#122), styled like PrivacySettings' tier pills for a
// consistent "this is a segmented preference" affordance across the app.
export function LengthControl({
  value,
  onChange,
}: {
  value: RankedListLength;
  onChange: (length: RankedListLength) => void;
}) {
  return (
    <div role="radiogroup" aria-label="List length" className="flex shrink-0 gap-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-brass text-ink'
                : 'border border-line text-neutral-400 hover:border-brass hover:text-brass-bright'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
