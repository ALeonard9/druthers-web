'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  buildShareDestination,
  publicShareUrl,
  shareVisibility,
  type ShareCategory,
  type ShareData,
  type ShareDestination,
} from '@/lib/shareCards';
import type { Visibility } from '@/lib/types';
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
  { format: 'square', label: 'Post 1:1', hint: 'square image' },
  { format: 'story', label: 'Story 9:16', hint: 'vertical image' },
  { format: 'wide', label: 'Wide', hint: 'X / link preview' },
  { format: 'grid', label: 'Every shelf', hint: 'all categories', needsAll: true },
];

type SharePlatform = 'facebook' | 'x';
const PLATFORM_LABEL: Record<SharePlatform, string> = {
  facebook: 'Facebook',
  x: 'X',
};

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))),
      'image/png',
    );
  });
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || iosNavigator.standalone === true;
}

export function isMobileOs(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

export function shouldUseNativeFileShare(
  platform: SharePlatform,
  canShareFiles: boolean,
): boolean {
  // Facebook's iOS PWA target is unreliable/absent. Its explicit composer is
  // the dependable route; the rendered image is copied or downloaded beside it.
  return platform !== 'facebook' && canShareFiles;
}

export function ShareTop5Button({
  data,
  initialCategory,
  className,
  destination,
  kind = 'ranked',
  visibilityField,
}: {
  data: ShareData;
  initialCategory?: ShareCategory;
  className?: string;
  destination?: ShareDestination;
  kind?: 'ranked' | 'watchlist';
  visibilityField?: keyof Visibility;
}) {
  const [open, setOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [platform, setPlatform] = useState<SharePlatform>('facebook');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [contextDestination, setContextDestination] =
    useState<ShareDestination | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const resolvedDestination =
    destination ??
    contextDestination ??
    buildShareDestination({
      handle: data.handle,
      visibility: data.profilePublic ? 'public' : 'private',
    });
  // Two different URLs for two different audiences. The rendered card image
  // and Facebook/X posts outlive this session and may be opened by anyone,
  // anywhere, later — those must always resolve, so they're forced to prod.
  // Copy URL and Send message are opened right now, by whoever the current
  // page is actually being served to (QA/local/prod), so they use
  // `resolvedDestination.url` as-is — it's already env-dynamic (built via
  // getSiteUrl() in buildShareDestination/contentUrl/profileUrl).
  const publicDestinationUrl = publicShareUrl(resolvedDestination.url);
  const copyableUrl = resolvedDestination.url;

  useEffect(() => {
    if (destination || (!initialCategory && !visibilityField)) return;
    let cancelled = false;
    fetch('/api/visibility').then(async (response) => {
      if (cancelled || !response.ok) return;
      const visibility: Visibility = await response.json();
      setContextDestination(
        buildShareDestination({
          handle: visibility.handle,
          visibility: visibilityField
            ? (visibility[visibilityField] as 'public' | 'friends' | 'private')
            : shareVisibility(visibility, initialCategory!, kind),
          category: initialCategory,
          kind,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [destination, initialCategory, kind, visibilityField]);

  useEffect(() => {
    if (!open) return;
    const placeMenu = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(288, window.innerWidth - 16);
      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    };
    placeMenu();
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
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

  const copyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(copyableUrl);
    setCopied(true);
    setNotice(null);
    window.setTimeout(() => setCopied(false), 2000);
  }, [copyableUrl]);

  const sendMessage = useCallback(async () => {
    const payload = messageSharePayload({
      category: initialCategory,
      kind,
      ownerHandle: window.location.pathname.startsWith('/u/')
        ? data.handle ?? undefined
        : undefined,
      url: copyableUrl,
    });
    if (typeof navigator.share === 'function' && isMobileOs()) {
      try {
        await navigator.share(payload);
        setOpen(false);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setNotice('The message share sheet could not open. Copy the URL instead.');
        }
      }
      return;
    }

    window.location.assign(
      `sms:?&body=${encodeURIComponent(`${payload.text}\n${payload.url}`)}`,
    );
    setOpen(false);
  }, [copyableUrl, data.handle, initialCategory, kind]);

  const formatFor = useCallback(
    (nextPlatform: SharePlatform) => {
      if (data.shelves.length === 0) {
        setNotice('This page has no visual card to format yet.');
        return;
      }
      setPlatform(nextPlatform);
      setOpen(false);
      setCardOpen(true);
    },
    [data.shelves.length],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share"
        className={
          className ??
          'inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-brass hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-brass'
        }
      >
        <ShareIcon />
        <span>Share</span>
      </button>
      {open && menuPosition && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Share options"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed z-[1200] w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-line bg-panel shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
              Share {resolvedDestination.label}
            </p>
            {resolvedDestination.warning && (
              <div className="mt-2 rounded-lg border border-brass/30 bg-brass-wash px-3 py-2 text-xs leading-relaxed text-neutral-300">
                {resolvedDestination.warning}{' '}
                {resolvedDestination.settingsHref && (
                  <Link
                    href={resolvedDestination.settingsHref}
                    className="font-medium text-brass hover:text-brass-bright"
                    onClick={() => setOpen(false)}
                  >
                    Sharing settings →
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="p-2">
            <MenuAction icon={<LinkIcon />} featured onClick={() => void copyUrl()}>
              {copied ? 'Copied URL ✓' : 'Copy URL'}
            </MenuAction>
            <div className="my-1 border-t border-line" />
            <MenuAction icon={<MessageIcon />} onClick={() => void sendMessage()}>
              Send message
            </MenuAction>
            <MenuAction icon={<FacebookIcon />} onClick={() => formatFor('facebook')}>
              Share on Facebook
            </MenuAction>
            <MenuAction icon={<XIcon />} onClick={() => formatFor('x')}>Share on X</MenuAction>
          </div>
          {notice && (
            <p role="status" className="border-t border-line px-4 py-3 text-xs text-brass">
              {notice}
            </p>
          )}
        </div>,
        document.body,
      )}
      {cardOpen && (
        <ShareModal
          data={{ ...data, url: publicDestinationUrl }}
          initialCategory={initialCategory}
          kind={kind}
          platform={platform}
          destinationUrl={publicDestinationUrl}
          onClose={() => setCardOpen(false)}
        />
      )}
    </div>
  );
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 3v11m0-11 4 4m-4-4L8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10H5.8A1.8 1.8 0 0 0 4 11.8v6.4A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-6.4a1.8 1.8 0 0 0-1.8-1.8H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="m9.5 14.5 5-5M7.3 17.7l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0M16.7 6.3l1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5.5 4.5h13A2.5 2.5 0 0 1 21 7v7a2.5 2.5 0 0 1-2.5 2.5H11L6 20v-3.5h-.5A2.5 2.5 0 0 1 3 14V7a2.5 2.5 0 0 1 2.5-2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7.5 9.5h9M7.5 12.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M13.6 22v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.5V14h2.8v8h3.3Z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
      <path d="M18.9 3h2.8l-6.1 7 7.2 11h-5.6l-4.4-5.7L7.7 21H4.9l6.6-7.5L4.6 3h5.8l4 5.3L18.9 3Zm-1 16h1.5L9.5 4.9H7.8L17.9 19Z" />
    </svg>
  );
}

function MenuAction({
  children,
  icon,
  onClick,
  featured = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brass ${
        featured
          ? 'mb-1 bg-brass py-3 font-semibold text-ink hover:bg-brass-bright'
          : 'py-2.5 text-neutral-200 hover:bg-brass-wash hover:text-paper'
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-current">{icon}</span>
      {children}
    </button>
  );
}

function ShareModal({
  data,
  initialCategory,
  kind,
  platform,
  destinationUrl,
  onClose,
}: {
  data: ShareData;
  initialCategory?: ShareCategory;
  kind: 'ranked' | 'watchlist';
  platform: SharePlatform;
  destinationUrl: string;
  onClose: () => void;
}) {
  const shelves = data.shelves;
  const [category, setCategory] = useState<ShareCategory>(
    initialCategory && shelves.some((s) => s.category === initialCategory)
      ? initialCategory
      : shelves[0].category,
  );
  const [format, setFormat] = useState<ShareFormat>('square');
  const [imageCopied, setImageCopied] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [canNativeShareFiles] = useState(() => {
    if (!isStandalonePwa() || typeof navigator.canShare !== 'function' || !isMobileOs()) return false;
    return navigator.canShare({
      files: [new File([''], 'druthers.png', { type: 'image/png' })],
    });
  });
  // The modal only mounts on click, so navigator exists — safe to detect
  // synchronously. canShare({files}) is the mobile share-sheet capability.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shelf = shelves.find((s) => s.category === category) ?? shelves[0];
  const dialogTitle = initialCategory
    ? shareDialogTitle(category, kind)
    : format === 'grid'
      ? 'Share all my shelves'
      : 'Share my Top 5';
  const useNativeFileShare = shouldUseNativeFileShare(platform, canNativeShareFiles);

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

  const copyImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      setImageNotice('Image copying is not supported in this browser. Download it instead.');
      return;
    }
    try {
      const blob = await toBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setImageCopied(true);
      setImageNotice(null);
      window.setTimeout(() => setImageCopied(false), 2000);
    } catch {
      setImageNotice('Could not copy the image. Download it instead.');
    }
  }, []);

  const share = useCallback(async () => {
    const postText = `${dialogTitle
      .replace(/^Share my /, 'My ')
      .replace(/^Share /, '')} on druthers`;
    if (useNativeFileShare) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const blob = await toBlob(canvas);
      const file = new File([blob], filename, { type: 'image/png' });
      try {
        await navigator.share({
          files: [file],
          title: dialogTitle,
          text: `${postText}\n${destinationUrl}`,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setImageNotice('The share sheet could not open. Copy or download the image instead.');
        }
      }
      return;
    }
    if (platform === 'facebook') {
      const canvas = canvasRef.current;
      let copyPromise: Promise<void> | null = null;
      if (canvas && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        try {
          copyPromise = navigator.clipboard.write([
            new ClipboardItem({ 'image/png': toBlob(canvas) }),
          ]);
        } catch {
          // The composer still opens; the inline notice offers Download as fallback.
        }
      }
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(destinationUrl)}`,
        '_blank',
        'noopener,noreferrer,width=720,height=720',
      );
      if (!copyPromise) {
        setImageNotice('Facebook opened, but this browser could not copy the image. Download it instead.');
        return;
      }
      try {
        await copyPromise;
        setImageCopied(true);
        setImageNotice('Image copied — paste the image in Facebook to attach it.');
        window.setTimeout(() => setImageCopied(false), 2000);
      } catch {
        setImageNotice('Facebook opened, but the image could not be copied. Download it instead.');
      }
      return;
    }
    if (platform === 'x') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(destinationUrl)}`,
        '_blank',
        'noopener,noreferrer,width=720,height=520',
      );
      return;
    }

  }, [destinationUrl, dialogTitle, filename, platform, useNativeFileShare]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialogTitle}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-xl border border-line bg-panel p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
              Share on {PLATFORM_LABEL[platform]}
            </p>
            <h2 className="font-display text-lg text-paper">{dialogTitle}</h2>
          </div>
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

        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={share}
            className="rounded-lg bg-brass px-4 py-3 text-sm font-semibold text-ink hover:bg-brass-bright"
          >
            {useNativeFileShare
              ? 'Share image…'
              : platform === 'facebook'
              ? 'Copy image & open Facebook'
              : 'Open X composer'}
          </button>
          {useNativeFileShare ? (
            <p className="text-center text-[11px] text-neutral-500">
              Choose {PLATFORM_LABEL[platform]} from the iOS share sheet.
            </p>
          ) : platform === 'facebook' && (
            <p className="text-center text-[11px] text-neutral-500">
              Then paste the image in Facebook to attach the formatted image.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void copyImage()}
              className="rounded-lg border border-line px-3 py-2.5 text-[13px] text-paper hover:border-brass"
            >
              {imageCopied ? 'Image copied ✓' : 'Copy image'}
            </button>
            <button
              type="button"
              onClick={download}
              className="rounded-lg border border-line px-3 py-2.5 text-[13px] text-paper hover:border-brass"
            >
              Download image
            </button>
          </div>
        </div>
        {imageNotice && <p role="status" className="mt-3 text-center text-xs text-brass">{imageNotice}</p>}
      </div>
    </div>,
    document.body,
  );
}

export function shareDialogTitle(
  category: ShareCategory,
  kind: 'ranked' | 'watchlist',
): string {
  const ranked: Record<ShareCategory, string> = {
    movies: 'Share my movies',
    tv: 'Share my TV',
    books: 'Share my books',
    games: 'Share my games',
  };
  const watchlist: Record<ShareCategory, string> = {
    movies: 'Share my movie watchlist',
    tv: 'Share my TV watchlist',
    books: 'Share my read list',
    games: 'Share my play list',
  };
  return kind === 'watchlist' ? watchlist[category] : ranked[category];
}

export function messageSharePayload({
  category,
  kind,
  ownerHandle,
  url,
}: {
  category?: ShareCategory;
  kind: 'ranked' | 'watchlist';
  ownerHandle?: string;
  url: string;
}): { title: string; text: string; url: string } {
  const rankedSubjects: Record<ShareCategory, string> = {
    movies: 'My movies',
    tv: 'My TV',
    books: 'My books',
    games: 'My games',
  };
  const watchlistSubjects: Record<ShareCategory, string> = {
    movies: 'My movie watchlist',
    tv: 'My TV watchlist',
    books: 'My reading list',
    games: 'My game backlog',
  };
  const owner = ownerHandle ? `@${ownerHandle}’s` : 'My';
  const subject = category
    ? ownerHandle
      ? kind === 'watchlist'
        ? watchlistSubjects[category].replace(/^My/, owner)
        : rankedSubjects[category].replace(/^My/, owner)
      : kind === 'watchlist'
        ? watchlistSubjects[category]
        : rankedSubjects[category]
    : `${owner} Druthers profile`;
  // `url` is passed through as-is — the caller decides whether it needs to
  // be forced to prod (content posted for others to open later) or left
  // env-dynamic (opened right now, by whoever this page is actually served
  // to). Rewriting it here regressed "Send message" on QA/local back to a
  // prod link no matter the environment.
  return {
    title: subject,
    text: `${subject} on Druthers`,
    url,
  };
}
