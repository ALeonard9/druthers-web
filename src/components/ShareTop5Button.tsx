'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShareCategory, ShareData } from '@/lib/shareCards';
import {
  ensureFontsLoaded,
  renderShareCard,
  type ShareFormat,
} from '@/lib/shareCardRender';

/**
 * "Share your Top 5" — button + modal from the Top 5 Share Cards design.
 * The preview canvas *is* the export surface (rendered at full resolution,
 * scaled by CSS), so what you see is exactly the PNG that ships.
 */

const FORMAT_OPTIONS: {
  format: ShareFormat;
  label: string;
  hint: string;
  needsAll?: boolean;
}[] = [
  { format: 'square', label: 'Post 1:1', hint: 'Instagram / Facebook' },
  { format: 'story', label: 'Story 9:16', hint: 'IG Stories / TikTok' },
  { format: 'wide', label: 'Wide', hint: 'X / link preview' },
  { format: 'grid', label: 'Every shelf', hint: 'all categories', needsAll: true },
];

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))),
      'image/png',
    );
  });
}

export function ShareTop5Button({
  data,
  initialCategory,
  className,
}: {
  data: ShareData;
  initialCategory?: ShareCategory;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (data.shelves.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'rounded border border-line px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-brass hover:text-paper'
        }
      >
        Share Top 5
      </button>
      {open && (
        <ShareModal
          data={data}
          initialCategory={initialCategory}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ShareModal({
  data,
  initialCategory,
  onClose,
}: {
  data: ShareData;
  initialCategory?: ShareCategory;
  onClose: () => void;
}) {
  const shelves = data.shelves;
  const [category, setCategory] = useState<ShareCategory>(
    initialCategory && shelves.some((s) => s.category === initialCategory)
      ? initialCategory
      : shelves[0].category,
  );
  const [format, setFormat] = useState<ShareFormat>('square');
  // The modal only mounts on click, so navigator exists — safe to detect
  // synchronously. canShare({files}) is the mobile share-sheet capability.
  const [canShareFiles] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({
        files: [new File([''], 'x.png', { type: 'image/png' })],
      }),
  );
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shelf = shelves.find((s) => s.category === category) ?? shelves[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureFontsLoaded();
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      renderShareCard(canvas, format, data, shelf);
    })();
    return () => {
      cancelled = true;
    };
  }, [data, shelf, format]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filename = `druthers-top5-${
    format === 'grid' ? 'every-shelf' : category
  }-${format}.png`;

  const download = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await toBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [filename]);

  const share = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await toBlob(canvas);
    const file = new File([blob], filename, { type: 'image/png' });
    try {
      await navigator.share({
        files: [file],
        title: 'My Top 5 on druthers',
      });
    } catch {
      // User dismissed the sheet — not an error.
    }
  }, [filename]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText('https://www.druthers.io');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share your Top 5"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-xl border border-line bg-panel p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-paper">Share your Top 5</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-neutral-500 hover:text-paper"
          >
            ✕
          </button>
        </div>

        {shelves.length > 1 && (
          <>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Category
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {shelves.map((s) => {
                const active = format !== 'grid' && s.category === category;
                return (
                  <button
                    key={s.category}
                    type="button"
                    disabled={format === 'grid'}
                    onClick={() => setCategory(s.category)}
                    className={`rounded-md border px-3.5 py-1.5 text-[13px] transition-colors disabled:opacity-40 ${
                      active
                        ? 'border-brass bg-brass-wash font-medium text-brass'
                        : 'border-line text-neutral-300 hover:text-paper'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          Format
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMAT_OPTIONS.filter((o) => !o.needsAll || shelves.length > 1).map(
            (o) => (
              <button
                key={o.format}
                type="button"
                onClick={() => setFormat(o.format)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-colors ${
                  format === o.format
                    ? 'border-brass bg-brass-wash'
                    : 'border-line hover:border-neutral-600'
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    format === o.format ? 'text-brass' : 'text-neutral-300'
                  }`}
                >
                  {o.label}
                </span>
                <span className="text-[9px] text-neutral-500">{o.hint}</span>
              </button>
            ),
          )}
        </div>

        <div className="mt-4 flex justify-center rounded-lg border border-line bg-night p-3">
          <canvas
            ref={canvasRef}
            aria-label="Share card preview"
            className="h-auto max-h-[52vh] w-auto max-w-full"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {canShareFiles && (
            <button
              type="button"
              onClick={share}
              className="col-span-2 rounded-lg bg-brass px-4 py-3 text-sm font-semibold text-ink hover:bg-brass-bright"
            >
              Share to…
            </button>
          )}
          <button
            type="button"
            onClick={download}
            className={`rounded-lg border border-line px-3 py-2.5 text-[13px] text-paper hover:border-brass ${
              canShareFiles ? '' : 'col-span-2 sm:col-span-1'
            }`}
          >
            Download image
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-line px-3 py-2.5 text-[13px] text-paper hover:border-brass"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        {canShareFiles && (
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            “Share to…” opens the native share sheet — Instagram, TikTok,
            Messages.
          </p>
        )}
      </div>
    </div>
  );
}
