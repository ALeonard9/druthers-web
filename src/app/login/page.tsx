import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/movies');
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 font-display text-3xl font-medium tracking-tight text-paper">Sign in</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Your personal Sandbox trackers.
      </p>

      <div className="rounded-lg border border-line bg-panel p-6">
        <GoogleSignIn clientId={clientId} />
      </div>

      {/* Local/dev fallback — production is Google-only. Requires that this
          origin is an Authorized JavaScript origin on the OAuth client. */}
      <details className="mt-6 text-sm text-neutral-500">
        <summary className="cursor-pointer hover:text-neutral-300">
          Developer sign-in (local)
        </summary>
        <div className="mt-4">
          <LoginForm />
        </div>
      </details>
    </div>
  );
}
