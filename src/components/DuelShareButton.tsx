'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FacebookIcon,
  isMobileOs,
  isStandalonePwa,
  ShareIcon,
  shouldUseNativeFileShare,
  XIcon,
} from './ShareTop5Button';
import {
  duelShareFilename,
  renderDuelShareCard,
  type DuelShareCard,
  type DuelShareFormat,
} from '@/lib/duelShareCardRender';
import { PUBLIC_SITE_URL } from '@/lib/shareCards';

export type DuelSharePlatform = 'facebook' | 'x';
type Platform = DuelSharePlatform;
const LABEL: Record<Platform, string> = {
  facebook: 'Facebook',
  x: 'X',
};

export function duelComposerUrl(platform: DuelSharePlatform): string {
  return platform === 'facebook'
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PUBLIC_SITE_URL)}`
    : 'https://x.com/compose/post';
}

export function DuelShareButton({ card }: { card: DuelShareCard }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [copied, setCopied] = useState(false);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const placeMenu = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(224, window.innerWidth - 16);
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    };
    placeMenu();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open]);

  async function copyDefaultImage() {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      setMenuNotice('Image copying is not supported in this browser.');
      return;
    }
    const canvas = document.createElement('canvas');
    await renderDuelShareCard(canvas, 'wide', card);
    try {
      const blob = await canvasBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setMenuNotice(null);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMenuNotice('Could not copy this image. Open a format to download it instead.');
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Share this duel"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-neutral-300 hover:border-brass hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <ShareIcon />
        Share duel
      </button>
      {open && menuPosition && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Share duel options"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed z-[1200] w-56 max-w-[calc(100vw-1rem)] rounded-xl border border-line bg-panel p-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => void copyDefaultImage()}
            className="flex w-full items-center gap-3 rounded-lg bg-brass px-3 py-3 text-left text-sm font-semibold text-ink hover:bg-brass-bright"
          >
            <span className="flex h-5 w-5 items-center justify-center"><CopyImageIcon /></span>
            {copied ? 'Image copied ✓' : 'Copy image'}
          </button>
          <div className="my-2 border-t border-line" />
          {(['facebook', 'x'] as Platform[]).map((item) => (
            <button
              key={item}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                setPlatform(item);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-200 hover:bg-brass-wash hover:text-paper"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {item === 'facebook' ? <FacebookIcon /> : <XIcon />}
              </span>
              Share on {LABEL[item]}
            </button>
          ))}
          {menuNotice && <p role="status" className="mt-2 px-3 pb-1 text-xs text-brass">{menuNotice}</p>}
        </div>,
        document.body,
      )}
      {platform && (
        <DuelFormatter card={card} platform={platform} onClose={() => setPlatform(null)} />
      )}
    </div>
  );
}

function DuelFormatter({
  card,
  platform,
  onClose,
}: {
  card: DuelShareCard;
  platform: Platform;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<DuelShareFormat>(
    'wide',
  );
  const [notice, setNotice] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canNativeShareFiles] = useState(() => {
    if (!isStandalonePwa() || typeof navigator.canShare !== 'function' || !isMobileOs()) return false;
    return navigator.canShare({
      files: [new File([''], 'druthers-duel.png', { type: 'image/png' })],
    });
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) void renderDuelShareCard(canvas, format, card);
  }, [card, format]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function post() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const useNativeFileShare = shouldUseNativeFileShare(platform, canNativeShareFiles);
    // Open platform composers in the original click turn. iOS PWA/Safari will
    // block a popup if canvas export is awaited first.
    if (!useNativeFileShare) {
      window.open(
        duelComposerUrl(platform),
        '_blank',
        platform === 'facebook'
          ? 'noopener,noreferrer,width=720,height=720'
          : 'noopener,noreferrer',
      );
    }
    const blob = await canvasBlob(canvas);
    const filename = duelShareFilename(format, Boolean(card.winnerId));
    const file = new File([blob], filename, { type: 'image/png' });
    if (useNativeFileShare) {
      try {
        await navigator.share({ files: [file], title: 'A druthers duel' });
      } catch {
        // Dismissing the native sheet is not an error.
      }
      return;
    }
    let copyPromise: Promise<void> | null = null;
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      try {
        copyPromise = navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch {
        // Fall through to the download guidance below.
      }
    }
    if (copyPromise) {
      try {
        await copyPromise;
        setNotice(`Image copied — press ⌘V in ${LABEL[platform]} to attach it.`);
        return;
      } catch {
        // Download below when clipboard access is denied.
      }
    }
    downloadBlob(blob, filename);
    setNotice(`Image downloaded — attach it to your ${LABEL[platform]} post.`);
  }

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/75 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Format duel for ${LABEL[platform]}`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-panel p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">Post to {LABEL[platform]}</p>
            <h2 className="font-display text-lg text-paper">Format this duel</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-neutral-500 hover:text-paper">✕</button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['square', 'wide', 'story'] as DuelShareFormat[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFormat(option)}
              className={`rounded-lg border px-3 py-2 text-xs capitalize ${format === option ? 'border-brass bg-brass-wash text-brass' : 'border-line text-neutral-300'}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 flex min-h-0 flex-1 justify-center rounded-lg border border-line bg-night p-3">
          <canvas ref={canvasRef} aria-label="Duel card preview" className="h-auto max-h-[58vh] w-auto max-w-full" />
        </div>
        <button type="button" onClick={() => void post()} className="mt-4 rounded-lg bg-brass px-4 py-3 text-sm font-semibold text-ink hover:bg-brass-bright">
          {shouldUseNativeFileShare(platform, canNativeShareFiles)
            ? 'Share image…'
            : `Copy image & open ${LABEL[platform]}`}
        </button>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          {shouldUseNativeFileShare(platform, canNativeShareFiles)
            ? `Choose ${LABEL[platform]} from the native share sheet.`
            : `Then press ⌘V in ${LABEL[platform]} to attach it.`}
        </p>
        {notice && <p role="status" className="mt-3 text-center text-xs text-brass">{notice}</p>}
      </div>
    </div>,
    document.body,
  );
}

function CopyImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('canvas export failed'))),
      'image/png',
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
