'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

type SkippedRow = {
  row: number;
  reason: string;
};

type RowError = {
  row: number;
  errors: string[];
};

type ImportResponse = {
  movies_created: number;
  movies_matched: number;
  trackers_created: number;
  trackers_updated: number;
  skipped: SkippedRow[];
  /** Watched movies awaiting a duel after the API automatically places the first. */
  unplaced_watched_movie_ids?: string[];
};

export function MoviesImport({ onComplete }: { onComplete?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    const isCsv = file.name.endsWith('.csv');
    const isXlsx = file.name.endsWith('.xlsx');
    if (!isCsv && !isXlsx) {
      setError('Please select a CSV or XLSX file.');
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setRowErrors(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/movies', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.row_errors) {
          setRowErrors(data.row_errors);
          setError(data.error || 'The file failed validation. Please fix the errors below and try again.');
        } else {
          throw new Error(data.error || 'Import failed.');
        }
        return;
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

  function reset() {
    setResult(null);
    setError(null);
    setRowErrors(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-5 shadow-sm">
      <div>
        <h3 className="font-display text-xl text-paper">Import Movies</h3>
        <p className="text-sm text-neutral-400">
          Upload a CSV or XLSX file to bulk import your watched movies and watchlist.
          {' '}
          <a
            href="/templates/movies-import-template.csv"
            download
            className="text-brass hover:text-brass-bright"
          >
            Download CSV template
          </a>
        </p>
      </div>

      {!result && !busy && !rowErrors && (
        <div
          className={`flex min-h-36 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragging ? 'border-brass bg-brass/10' : 'border-neutral-700 bg-night hover:border-brass'
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <p className="text-sm text-neutral-300">Drop your CSV or XLSX file here</p>
          <p className="mt-1 text-xs text-neutral-500">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 text-sm font-medium text-brass hover:text-brass-bright"
          >
            Select file
          </button>
          <input
            ref={inputRef}
            aria-label="Select file"
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <p className="mt-3 text-xs text-neutral-500">CSV or XLSX · up to 5 MB</p>
        </div>
      )}

      {busy && (
        <div role="status" className="flex items-center gap-3 text-sm text-brass">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          Checking and importing your library...
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-red-400">{error}</p>
          {rowErrors && (
            <div className="mt-2">
              <p className="text-sm font-medium text-neutral-300">Validation Errors</p>
              <div className="mt-2 max-h-60 overflow-y-auto rounded border border-red-900/50 bg-red-950/20 p-2 text-xs">
                {rowErrors.map((r, i) => (
                  <div key={i} className="flex flex-col border-b border-red-900/50 p-2 last:border-0">
                    <span className="font-medium text-red-400">Row {r.row}</span>
                    <ul className="mt-1 list-inside list-disc pl-2 text-neutral-300">
                      {r.errors.map((msg, j) => (
                        <li key={j}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button
                onClick={reset}
                className="mt-4 w-fit rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-paper hover:bg-neutral-700"
              >
                Upload corrected file
              </button>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3 text-sm text-neutral-300">
          <div className="rounded border border-green-900/50 bg-green-950/20 p-4 text-green-400">
            <p className="font-medium">Import complete!</p>
            <ul className="mt-2 list-inside list-disc text-xs text-neutral-400">
              <li>{result.trackers_created} movies added to your shelves</li>
              <li>{result.trackers_updated} movies updated</li>
              <li>{result.movies_matched} existing movies recognized</li>
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

          {result.unplaced_watched_movie_ids && result.unplaced_watched_movie_ids.length > 0 && (
            <Link
              href={`/movies/ranking?item=${result.unplaced_watched_movie_ids[0]}`}
              className="w-fit rounded bg-brass px-4 py-2 text-xs font-medium text-ink hover:bg-brass-bright"
            >
              Rank {result.unplaced_watched_movie_ids.length === 1 ? 'this movie' : 'your imported movies'} →
            </Link>
          )}

          <button
            onClick={reset}
            className="mt-2 w-fit rounded bg-neutral-800 px-4 py-2 text-xs font-medium text-paper hover:bg-neutral-700"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
