import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GoodreadsImport } from '@/components/GoodreadsImport';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function GoodreadsImportPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/books/search" className="text-sm text-brass hover:text-brass-bright">
        ← Back to Add books
      </Link>
      <div className="border-l-2 border-brass pl-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass">Add books in bulk</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-paper">
          Bring your Goodreads shelves home
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
          Export your library from Goodreads, then upload its CSV here. We will match books
          already in Druthers and add the rest to your shelves.
        </p>
      </div>
      <GoodreadsImport />
      <p className="text-xs leading-5 text-neutral-500">
        Your file is used only to import your library. You can export your Druthers data from Settings at any time.
      </p>
    </div>
  );
}
