'use client';

export function FilterChip({
  filterKey,
  value,
  onRemove,
}: {
  filterKey: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-brass-wash px-2 py-0.5 text-xs font-medium text-brass">
      <span className="text-brass/70">{filterKey}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${filterKey}:${value}`}
        className="ml-0.5 text-brass/50 hover:text-brass focus:outline-none focus:ring-1 focus:ring-brass rounded"
      >
        &times;
      </button>
    </span>
  );
}
