import { personLabel, type ImpersonationMeta } from '@/lib/sessionCookies';
import { ImpersonationEscapeButton } from './ImpersonationEscapeButton';

/**
 * One of three mechanisms that make an active view-as session unmissable
 * (#250) - the other two are the body ring and the document-title prefix,
 * both applied in the root layout alongside this. A strip alone is not
 * enough: it scrolls away on the second screen of a long shelf, which is
 * exactly where an admin forgets they are impersonating.
 *
 * Server-rendered from the same cookie that scopes the API request
 * (getImpersonationMeta(), read once in the root layout and passed down),
 * so a brand new tab gets the banner on first paint - it is a cookie, not
 * client state, so a new tab is impersonating too.
 *
 * Deliberately not dismissible (no close button) and deliberately red, never
 * brass: EnvBanner already owns brass as the app's own accent and is
 * dismissible, and the two must never be confused or dismissed as a pair.
 */
export function ImpersonationBanner({ meta }: { meta: ImpersonationMeta }) {
  return (
    <div
      role="note"
      className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-red-600 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-sm text-white"
    >
      <span>
        Viewing as <strong>{personLabel(meta.target)}</strong>
        {/* Only appended when personLabel used the handle - otherwise
            display_name (or email) is already the label itself. */}
        {meta.target.handle && meta.target.display_name && (
          <> ({meta.target.display_name})</>
        )}
        {' - acting admin '}
        {personLabel(meta.acting_admin)}
      </span>
      <ImpersonationEscapeButton targetId={meta.target.id} />
    </div>
  );
}
