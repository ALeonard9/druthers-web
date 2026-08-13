'use client';

import { useState } from 'react';

type SkippedRow = {
  row: number;
  reason: string;
};

type ImportResponse = {
  books_created: number;
  books_matched: number;
  trackers_created: number;
  trackers_updated: number;
  skipped: SkippedRow[];
  error?: string;
};

export function GoodreadsImport({ onComplete }: { onComplete?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/goodreads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed.');
      }
      setResult(data);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-sm">
      <div>
        <h3 className="font-display text-xl text-paper">Import from Goodreads</h3>
        <p className="text-sm text-neutral-400">
          Upload your Goodreads library export CSV to instantly populate your Druthers book collection.
        </p>
      </div>

      {!result && !busy && (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 bg-night p-6 text-center transition-colors hover:border-brass">
          <label className="cursor-pointer text-sm font-medium text-brass hover:text-brass-bright">
            <span>Select CSV File</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-3 text-sm text-brass">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          Importing your library...
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 text-sm text-neutral-300">
          <div className="rounded border border-green-900/50 bg-green-950/20 p-4 text-green-400">
            <p className="font-medium">Import complete!</p>
            <ul className="mt-2 list-inside list-disc text-xs text-neutral-400">
              <li>{result.trackers_created} books added to your shelves</li>
              <li>{result.trackers_updated} books updated</li>
            </ul>
          </div>

          {result.skipped && result.skipped.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-neutral-300">Skipped items</p>
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-line bg-night p-2 text-xs">
                {result.skipped.map((s, i) => (
                  <div key={i} className="flex justify-between border-b border-line/50 p-1 last:border-0">
                    <span className="text-neutral-500">Row {s.row}</span>
                    <span className="text-neutral-300">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="mt-2 w-fit rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-paper hover:bg-neutral-700"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
