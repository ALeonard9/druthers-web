// Title-vs-query relevance for search results. Providers return their own
// orderings; we re-rank so close matches surface first ("a storm of swords"
// puts the exact book above spin-offs).

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(s: string): Map<string, number> {
  const grams = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i += 1) {
    const g = s.slice(i, i + 2);
    grams.set(g, (grams.get(g) ?? 0) + 1);
  }
  return grams;
}

/** Sørensen–Dice over character bigrams, with exact/prefix boosts. 0–1. */
export function similarity(query: string, title: string): number {
  const q = normalize(query);
  const t = normalize(title);
  if (!q || !t) return 0;
  if (q === t) return 1;
  // "spider man" and "Spider-Man" are the same title.
  if (q.replace(/\s/g, '') === t.replace(/\s/g, '')) return 1;

  const qg = bigrams(q);
  const tg = bigrams(t);
  let overlap = 0;
  let qTotal = 0;
  for (const [gram, count] of qg) {
    qTotal += count;
    overlap += Math.min(count, tg.get(gram) ?? 0);
  }
  let tTotal = 0;
  for (const count of tg.values()) tTotal += count;
  const dice = qTotal + tTotal === 0 ? 0 : (2 * overlap) / (qTotal + tTotal);

  // A title that starts with the query is a closer match than the raw
  // bigram score suggests ("Dune" vs "Dune Messiah").
  if (t.startsWith(q)) return Math.max(dice, 0.75 + dice / 4);
  return dice;
}

/** Sort a result list by similarity to the query, descending, stable. */
export function rankResults<T extends { title: string }>(
  query: string,
  results: T[],
): T[] {
  return results
    .map((r, i) => ({ r, i, score: similarity(query, r.title) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ r }) => r);
}

/** The best similarity in a list — used to order whole sections. */
export function bestScore(
  query: string,
  results: { title: string }[],
): number {
  return results.reduce((best, r) => Math.max(best, similarity(query, r.title)), 0);
}
