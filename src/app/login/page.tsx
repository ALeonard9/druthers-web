import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/movies');
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Your personal Sandbox trackers.
      </p>
      <LoginForm />
    </div>
  );
}
