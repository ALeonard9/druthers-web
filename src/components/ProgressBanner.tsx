// Small contextual nudge shown on a domain's shelf page (movies/tv/books/
// games) while the ranked list is still thin. See lib/progress.ts for the
// threshold/copy logic — this is just the presentational shell, styled to
// match the site's dark "after-hours archive" panels.
export function ProgressBanner({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-neutral-300">
      <span className="text-brass">✦</span>
      {message}
    </p>
  );
}
