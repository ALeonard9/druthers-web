import type { ShelfViewMode } from '@/lib/shelfViewMode';

const OPTIONS: { value: ShelfViewMode; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'icons', label: 'Icons' },
];

// List / Carousel / Icons, Finder-style (#122 — Adam's addition to the
// original length-control scope). A browsing preference, so it lives beside
// LengthControl but isn't tied to the same cross-device storage.
export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ShelfViewMode;
  onChange: (mode: ShelfViewMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Shelf view" className="flex shrink-0 gap-1">
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
