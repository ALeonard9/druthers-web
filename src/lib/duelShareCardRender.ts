import type { DuelEntry } from './duelShelves';

export type DuelShareFormat = 'square' | 'wide' | 'story';

export interface DuelShareCard {
  left: DuelEntry;
  right: DuelEntry;
  winnerId?: string;
  rank?: number;
}

const DIMENSIONS: Record<DuelShareFormat, [number, number]> = {
  square: [1080, 1080],
  wide: [1200, 630],
  story: [1080, 1920],
};

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function cover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

export async function renderDuelShareCard(
  canvas: HTMLCanvasElement,
  format: DuelShareFormat,
  card: DuelShareCard,
) {
  const [width, height] = DIMENSIONS[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const [leftImage, rightImage] = await Promise.all([
    loadImage(card.left.imageUrl),
    loadImage(card.right.imageUrl),
  ]);
  const pad = Math.round(width * 0.055);
  const gap = Math.round(width * 0.035);
  const header = format === 'story' ? 300 : 150;
  const footer = format === 'story' ? 300 : 125;
  const panelWidth = (width - pad * 2 - gap) / 2;
  const panelHeight = height - header - footer;

  ctx.fillStyle = '#101014';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#c9a86a';
  ctx.font = `600 ${Math.round(width * 0.032)}px Georgia`;
  ctx.fillText('’druthers', pad, Math.round(header * 0.42));
  ctx.fillStyle = '#f4eddf';
  ctx.font = `600 ${Math.round(width * 0.05)}px Georgia`;
  ctx.textAlign = 'center';
  ctx.fillText(card.winnerId ? 'The verdict' : 'Which would you rather?', width / 2, Math.round(header * 0.78));

  const entries = [card.left, card.right];
  const images = [leftImage, rightImage];
  entries.forEach((entry, index) => {
    const x = pad + index * (panelWidth + gap);
    const winner = card.winnerId === entry.id;
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(x, header, panelWidth, panelHeight);
    if (images[index]) {
      cover(ctx, images[index] as HTMLImageElement, x, header, panelWidth, panelHeight);
      const gradient = ctx.createLinearGradient(0, header + panelHeight * 0.45, 0, header + panelHeight);
      gradient.addColorStop(0, 'rgba(16,16,20,0)');
      gradient.addColorStop(1, 'rgba(16,16,20,0.96)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, header, panelWidth, panelHeight);
    }
    if (winner) {
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = Math.max(8, width * 0.008);
      ctx.strokeRect(x, header, panelWidth, panelHeight);
      ctx.fillStyle = '#c9a86a';
      ctx.font = `700 ${Math.round(width * 0.025)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(`WINNER${card.rank ? ` · NOW #${card.rank}` : ''}`, x + 28, header + 50);
    }
    ctx.fillStyle = '#f4eddf';
    ctx.font = `600 ${Math.round(width * 0.031)}px Arial`;
    ctx.textAlign = 'center';
    const title = entry.title.length > 28 ? `${entry.title.slice(0, 27)}…` : entry.title;
    ctx.fillText(title, x + panelWidth / 2, header + panelHeight - 54);
  });

  ctx.fillStyle = '#c9a86a';
  ctx.beginPath();
  ctx.arc(width / 2, header + panelHeight / 2, Math.round(width * 0.038), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101014';
  ctx.font = `800 ${Math.round(width * 0.025)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('VS', width / 2, header + panelHeight / 2 + Math.round(width * 0.009));

  ctx.fillStyle = '#a4a4ad';
  ctx.font = `${Math.round(width * 0.018)}px Arial`;
  ctx.fillText('druthers.io · your favorites, ranked', width / 2, height - Math.round(footer * 0.35));
}

export function duelShareFilename(format: DuelShareFormat, verdict: boolean) {
  return `druthers-duel-${verdict ? 'verdict' : 'matchup'}-${format}.png`;
}
