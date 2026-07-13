import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { LogoutButton } from './LogoutButton';
import { EnvBadge } from './EnvBadge';

export async function NavBar() {
  const user = await getSessionUser();
  return (
    <header className="border-b border-neutral-800 bg-neutral-900">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/movies" className="text-lg font-semibold text-white">
            aleonard<span className="text-indigo-400">.us</span>
          </Link>
          <EnvBadge />
          {user && (
            <div className="flex items-center gap-4 text-sm text-neutral-300">
              <Link href="/movies" className="hover:text-white">
                Movies
              </Link>
              <Link href="/tv" className="hover:text-white">
                TV
              </Link>
              <Link href="/books" className="hover:text-white">
                Books
              </Link>
              <Link href="/games" className="hover:text-white">
                Games
              </Link>
              <Link href="/countries" className="hover:text-white">
                Countries
              </Link>
            </div>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-400">{user.email}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
