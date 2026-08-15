import { SHELVES, type ShelfId } from './duelShelves';

const ENABLE_SHELF_PATH = '/settings/shelves/enable';

export function safeShelfDestination(
  candidate: string | undefined,
  shelf: ShelfId,
): string {
  const fallback = SHELVES[shelf].shelfHref;
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }
  if (candidate.includes('\\') || /[\u0000-\u001f\u007f]/.test(candidate)) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, 'https://druthers.local');
    if (parsed.origin !== 'https://druthers.local') return fallback;
    if (parsed.pathname === ENABLE_SHELF_PATH) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
