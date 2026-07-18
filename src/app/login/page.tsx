import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { UnreadCount } from '@/lib/types';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { LoginForm } from '@/components/LoginForm';

async function sessionIsValid(): Promise<boolean> {
  // The user cookie alone isn't proof — an expired/stale JWT with a
  // lingering cookie caused a /login ↔ / redirect loop. Only bounce away
  // from the login page when the token actually works.
  try {
    await apiFetch<UnreadCount>('/v1/users/me/notifications/unread-count');
    return true;
  } catch (err) {
    if (err instanceof ApiError) return false;
    throw err;
  }
}

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user && (await sessionIsValid())) redirect('/');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 font-display text-3xl font-medium tracking-tight text-paper">
        <span className="mr-0.5 not-italic text-brass">’</span>druthers
      </h1>
      <p className="mb-6 text-sm text-neutral-400">
        Your favorites — watched, read, played, and ranked.
      </p>

      <div className="rounded-lg border border-line bg-panel p-6">
        <GoogleSignIn clientId={clientId} />
      </div>

      {/* Local/dev fallback — hidden in prod builds, where the API's
          DISABLE_PASSWORD_LOGIN rejects password auth anyway (belt and
          suspenders). NEXT_PUBLIC_APP_ENV is baked at build time. */}
      {process.env.NEXT_PUBLIC_APP_ENV !== 'prod' && (
        <details className="mt-6 text-sm text-neutral-500">
          <summary className="cursor-pointer hover:text-neutral-300">
            Developer sign-in (local)
          </summary>
          <div className="mt-4">
            <LoginForm />
          </div>
        </details>
      )}
    </div>
  );
}
