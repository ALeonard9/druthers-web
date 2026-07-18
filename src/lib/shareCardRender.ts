import type { ShareData, ShareShelf } from './shareCards';

/**
 * Canvas renderers for the shareable Top 5 cards. Each format draws the
 * "Top 5 Share Cards" design at export resolution; the modal shows the same
 * canvas scaled down, so the preview is exactly what gets shared.
 *
 * Formats (from the design):
 *   square 1080×1080 — IG/FB post
 *   story  1080×1920 — IG Stories / TikTok, paper "ticket stub"
 *   wide   1200×630  — X / FB link card
 *   grid   1080×1080 — all four categories, one post
 */

export type ShareFormat = 'square' | 'story' | 'wide' | 'grid';

export const FORMAT_SIZES: Record<ShareFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  wide: { w: 1200, h: 630 },
  grid: { w: 1080, h: 1080 },
};

// "After-hours archive" tokens (globals.css) + paper-side inks from the design.
const C = {
  night: '#101014',
  line: '#26262e',
  paper: '#f2ead8',
  ink: '#1c1917',
  brass: '#c9a86a',
  brassWash: '#292217',
  grey: '#8a8a93',
  muted: '#a3a3ad',
  paperGold: '#9a6c1f',
  paperMuted: '#7a6f5c',
  paperDash: '#cfc3a8',
};

interface Fonts {
  display: string;
  sans: string;
  mono: string;
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function resolveFonts(): Fonts {
  return {
    display: cssVar('--font-fraunces', 'Georgia, serif'),
    sans: cssVar('--font-instrument', 'ui-sans-serif, system-ui, sans-serif'),
    mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
  };
}

/** Wait until the page fonts are usable in canvas. */
export async function ensureFontsLoaded(): Promise<void> {
  await document.fonts.ready;
}

function monthYear(): string {
  return new Date()
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase();
}

type Ctx = CanvasRenderingContext2D;

function setSpacing(ctx: Ctx, px: number) {
  // letterSpacing is baseline in modern browsers; harmless no-op elsewhere.
  const c = ctx as Ctx & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = `${px}px`;
}

function mono(ctx: Ctx, f: Fonts, size: number, spacing = 0) {
  ctx.font = `${size}px ${f.mono}`;
  setSpacing(ctx, spacing);
}

function display(ctx: Ctx, f: Fonts, size: number, weight = 400) {
  ctx.font = `${weight} ${size}px ${f.display}`;
  setSpacing(ctx, 0);
}

function sans(ctx: Ctx, f: Fonts, size: number, weight = 400) {
  ctx.font = `${weight} ${size}px ${f.sans}`;
  setSpacing(ctx, 0);
}

function truncate(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t.trimEnd()}…`;
}

function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 2, dash: number[] = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function background(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

function wordmark(ctx: Ctx, f: Fonts, x: number, y: number, size: number, color: string) {
  display(ctx, f, size, 600);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText('’druthers', x, y);
}

/** Number chip + title + year row (square/wide formats). */
function rankRow(
  ctx: Ctx,
  f: Fonts,
  o: {
    x: number;
    y: number;
    w: number;
    h: number;
    rank: number;
    title: string;
    year: number | null;
    chipW: number;
    chipH: number;
    numSize: number;
    titleSize: number;
    yearSize: number;
    topBorder: boolean;
    bottomBorder: boolean;
  },
) {
  if (o.topBorder) line(ctx, o.x, o.y, o.x + o.w, o.y, C.line);
  if (o.bottomBorder) line(ctx, o.x, o.y + o.h, o.x + o.w, o.y + o.h, C.line);
  const cy = o.y + o.h / 2;

  const chipY = cy - o.chipH / 2;
  ctx.fillStyle = C.brassWash;
  rounded(ctx, o.x, chipY, o.chipW, o.chipH, 8);
  ctx.fill();
  display(ctx, f, o.numSize);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(o.rank), o.x + o.chipW / 2, chipY + o.chipH / 2 + 2);

  const gap = o.chipW * 0.4;
  const titleX = o.x + o.chipW + gap;
  mono(ctx, f, o.yearSize);
  const yearText = o.year != null ? String(o.year) : '';
  const yearW = yearText ? ctx.measureText(yearText).width : 0;
  const titleMax = o.x + o.w - titleX - yearW - gap;

  sans(ctx, f, o.titleSize, 500);
  ctx.fillStyle = C.paper;
  ctx.textAlign = 'left';
  ctx.fillText(truncate(ctx, o.title, titleMax), titleX, cy + 2);

  if (yearText) {
    mono(ctx, f, o.yearSize);
    ctx.fillStyle = C.grey;
    ctx.textAlign = 'right';
    ctx.fillText(yearText, o.x + o.w, cy + 2);
  }
  ctx.textBaseline = 'alphabetic';
}

// --- square 1080×1080 -------------------------------------------------------

function drawSquare(ctx: Ctx, f: Fonts, data: ShareData, s: ShareShelf) {
  const { w, h } = FORMAT_SIZES.square;
  const pad = 88;
  background(ctx, w, h);

  wordmark(ctx, f, pad, pad + 34, 44, C.paper);
  mono(ctx, f, 22, 4);
  ctx.fillStyle = C.grey;
  ctx.textAlign = 'right';
  ctx.fillText(
    `@${data.handle.toUpperCase()} · ${new Date().getFullYear()}`,
    w - pad,
    pad + 34,
  );

  mono(ctx, f, 22, 5);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'left';
  ctx.fillText('MY TOP 5', pad, pad + 140);
  display(ctx, f, 80, 500);
  ctx.fillStyle = C.paper;
  ctx.fillText(s.label, pad, pad + 232);

  const top = pad + 292;
  const bottom = h - pad - 68;
  const rh = (bottom - top) / 5;
  s.top.forEach((e, i) => {
    rankRow(ctx, f, {
      x: pad,
      y: top + i * rh,
      w: w - pad * 2,
      h: rh,
      rank: i + 1,
      title: e.title,
      year: e.year,
      chipW: 80,
      chipH: 60,
      numSize: 36,
      titleSize: 36,
      yearSize: 24,
      topBorder: true,
      bottomBorder: i === s.top.length - 1,
    });
  });

  mono(ctx, f, 22, 4);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'left';
  ctx.fillText('DRUTHERS.IO', pad, h - pad + 30);
  ctx.fillStyle = C.grey;
  ctx.textAlign = 'right';
  ctx.fillText(`${data.totalRanked} RANKED`, w - pad, h - pad + 30);
}

// --- story 1080×1920 (paper ticket) ----------------------------------------

function drawStory(ctx: Ctx, f: Fonts, data: ShareData, s: ShareShelf) {
  const { w, h } = FORMAT_SIZES.story;
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, w, h);

  const tw = 850;
  const th = 1480;
  const tx = (w - tw) / 2;
  const ty = (h - th) / 2;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = 36;
  ctx.fillStyle = C.paper;
  rounded(ctx, tx, ty, tw, th, 27);
  ctx.fill();
  ctx.restore();

  const px = tx + 80;
  const pw = tw - 160;

  wordmark(ctx, f, px, ty + 120, 53, C.ink);
  mono(ctx, f, 27, 4);
  ctx.fillStyle = C.paperMuted;
  ctx.textAlign = 'right';
  ctx.fillText(`${data.totalRanked} RANKED`, px + pw, ty + 120);

  mono(ctx, f, 27, 6);
  ctx.fillStyle = C.paperGold;
  ctx.textAlign = 'left';
  ctx.fillText(`@${data.handle.toUpperCase()}’S TOP 5`, px, ty + 232);
  display(ctx, f, 78, 500);
  ctx.fillStyle = C.ink;
  ctx.fillText('All-Time', px, ty + 330);
  ctx.fillText(truncate(ctx, s.label, pw), px, ty + 420);

  const rowsTop = ty + 490;
  const rh = 122;
  s.top.forEach((e, i) => {
    const y = rowsTop + i * rh;
    line(ctx, px, y, px + pw, y, C.paperDash, 2, [8, 10]);
    const cy = y + rh / 2;
    ctx.textBaseline = 'middle';
    display(ctx, f, 45);
    ctx.fillStyle = C.paperGold;
    ctx.textAlign = 'left';
    ctx.fillText(String(i + 1), px, cy);

    mono(ctx, f, 29);
    const yearText = e.year != null ? String(e.year) : '';
    const yearW = yearText ? ctx.measureText(yearText).width : 0;
    sans(ctx, f, 40, 500);
    ctx.fillStyle = C.ink;
    ctx.fillText(truncate(ctx, e.title, pw - 80 - yearW - 40), px + 80, cy);
    if (yearText) {
      mono(ctx, f, 29);
      ctx.fillStyle = C.paperMuted;
      ctx.textAlign = 'right';
      ctx.fillText(yearText, px + pw, cy);
    }
    ctx.textBaseline = 'alphabetic';
  });

  // Perforation with edge notches
  const perfY = rowsTop + 5 * rh + 40;
  line(ctx, tx, perfY, tx + tw, perfY, C.paperDash, 5, [16, 16]);
  ctx.fillStyle = C.night;
  for (const nx of [tx, tx + tw]) {
    ctx.beginPath();
    ctx.arc(nx, perfY, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  const footY = perfY + 78;
  mono(ctx, f, 27, 5);
  ctx.fillStyle = C.paperGold;
  ctx.textAlign = 'left';
  const link = `DRUTHERS.IO/${data.handle.toUpperCase()}`;
  ctx.fillText(link, px, footY);
  line(ctx, px, footY + 12, px + ctx.measureText(link).width, footY + 12, C.paperDash, 2);
  mono(ctx, f, 27);
  ctx.fillStyle = C.paperMuted;
  ctx.textAlign = 'right';
  ctx.fillText(monthYear(), px + pw, footY);

  ctx.restore();
}

// --- wide 1200×630 ----------------------------------------------------------

function drawWide(ctx: Ctx, f: Fonts, data: ShareData, s: ShareShelf) {
  const { w, h } = FORMAT_SIZES.wide;
  const colW = 410;
  const pad = 56;
  background(ctx, w, h);
  line(ctx, colW, 0, colW, h, C.line);

  wordmark(ctx, f, pad, pad + 30, 40, C.paper);
  mono(ctx, f, 20, 4);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'left';
  ctx.fillText('MY TOP 5', pad, h / 2 - 44);
  display(ctx, f, 64, 500);
  ctx.fillStyle = C.paper;
  ctx.fillText(truncate(ctx, s.label, colW - pad * 2), pad, h / 2 + 32);
  mono(ctx, f, 20);
  ctx.fillStyle = C.grey;
  ctx.fillText(
    `@${data.handle.toUpperCase()} · ${new Date().getFullYear()}`,
    pad,
    h / 2 + 84,
  );
  mono(ctx, f, 20, 4);
  ctx.fillStyle = C.brass;
  ctx.fillText('DRUTHERS.IO', pad, h - pad + 10);

  const rx = colW + 56;
  const rw = w - rx - pad;
  const top = 40;
  const rh = (h - top * 2) / 5;
  s.top.forEach((e, i) => {
    rankRow(ctx, f, {
      x: rx,
      y: top + i * rh,
      w: rw,
      h: rh,
      rank: i + 1,
      title: e.title,
      year: e.year,
      chipW: 64,
      chipH: 48,
      numSize: 30,
      titleSize: 30,
      yearSize: 22,
      topBorder: i > 0,
      bottomBorder: false,
    });
  });
}

// --- grid 1080×1080 (all shelves) ------------------------------------------

function drawGrid(ctx: Ctx, f: Fonts, data: ShareData) {
  const { w, h } = FORMAT_SIZES.grid;
  const pad = 64;
  background(ctx, w, h);

  wordmark(ctx, f, pad, pad + 28, 36, C.paper);
  mono(ctx, f, 20, 4);
  ctx.fillStyle = C.grey;
  ctx.textAlign = 'right';
  ctx.fillText(`${data.totalRanked} RANKED`, w - pad, pad + 28);

  mono(ctx, f, 18, 5);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'left';
  ctx.fillText(`@${data.handle.toUpperCase()}’S ALL-TIMERS`, pad, pad + 92);
  display(ctx, f, 52, 500);
  ctx.fillStyle = C.paper;
  ctx.fillText('Top 5, Every Shelf', pad, pad + 156);

  const gx = pad;
  const gy = pad + 200;
  const gw = w - pad * 2;
  const gh = h - gy - pad - 40;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(gx, gy, gw, gh);
  line(ctx, gx + gw / 2, gy, gx + gw / 2, gy + gh, C.line);
  line(ctx, gx, gy + gh / 2, gx + gw, gy + gh / 2, C.line);

  data.shelves.slice(0, 4).forEach((s, idx) => {
    const cx = gx + (idx % 2) * (gw / 2) + 40;
    const cy = gy + Math.floor(idx / 2) * (gh / 2) + 62;
    const cw = gw / 2 - 80;
    display(ctx, f, 30, 500);
    ctx.fillStyle = C.paper;
    ctx.textAlign = 'left';
    ctx.fillText(s.label, cx, cy);
    s.top.forEach((e, i) => {
      const ly = cy + 48 + i * 40;
      display(ctx, f, 24);
      ctx.fillStyle = C.brass;
      ctx.fillText(String(i + 1), cx, ly);
      sans(ctx, f, 24, i === 0 ? 500 : 400);
      ctx.fillStyle = i === 0 ? C.paper : C.muted;
      ctx.fillText(truncate(ctx, e.title, cw - 36), cx + 36, ly);
    });
  });

  mono(ctx, f, 20, 4);
  ctx.fillStyle = C.brass;
  ctx.textAlign = 'left';
  const link = `DRUTHERS.IO/${data.handle.toUpperCase()}`;
  ctx.fillText(link, pad, h - pad + 20);
  line(ctx, pad, h - pad + 32, pad + ctx.measureText(link).width, h - pad + 32, C.brassWash, 2);
  mono(ctx, f, 20);
  ctx.fillStyle = C.grey;
  ctx.textAlign = 'right';
  ctx.fillText(monthYear(), w - pad, h - pad + 20);
}

// ---------------------------------------------------------------------------

export function renderShareCard(
  canvas: HTMLCanvasElement,
  format: ShareFormat,
  data: ShareData,
  shelf: ShareShelf,
): void {
  const { w, h } = FORMAT_SIZES[format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const f = resolveFonts();
  ctx.textBaseline = 'alphabetic';

  if (format === 'square') drawSquare(ctx, f, data, shelf);
  else if (format === 'story') drawStory(ctx, f, data, shelf);
  else if (format === 'wide') drawWide(ctx, f, data, shelf);
  else drawGrid(ctx, f, data);
}
