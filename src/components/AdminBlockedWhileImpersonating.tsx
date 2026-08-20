import { personLabel, type ImpersonationMeta } from '@/lib/sessionCookies';
import { ImpersonationEscapeButton } from './ImpersonationEscapeButton';

/**
 * What `/admin` (and every route under it) renders while an impersonation
 * session is active (#250). Blocked, not hidden: an admin console rendered
 * inside an impersonated identity - one click from taking an action as the
 * acting admin while looking at someone else's account - is the worst screen
 * in this batch, so this replaces the whole route group's children rather
 * than letting any of it render underneath a warning.
 */
export function AdminBlockedWhileImpersonating({ meta }: { meta: ImpersonationMeta }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-red-900 bg-red-950/20 px-4 py-6">
      <p className="text-sm text-neutral-200">
        You are viewing as <strong>{personLabel(meta.target)}</strong>. Return to admin
        to continue.
      </p>
      <ImpersonationEscapeButton
        targetId={meta.target.id}
        label="Return to admin"
        className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
      />
    </div>
  );
}
