import type { SessionUser } from './types';

/**
 * Whether the readable session cookie *claims* the account is an admin.
 *
 * Split out from adminAuth.ts (which pulls in `next/headers` via
 * lib/session and so is server-only) because this one is safe to import
 * from client components like Sidebar - it only reads a prop, never a
 * cookie store directly.
 *
 * This is the render-only hint: `aleonard_user` is httpOnly:false so it can
 * drive the sidebar link without decoding the JWT client-side, but a user
 * can edit it. Never use this to decide what renders inside `/admin` itself
 * - only the server-side gate in adminAuth.ts's requireAdminUser() does that.
 */
export function isAdminHint(user: SessionUser | null): boolean {
  return user?.user_group === 'admin';
}
