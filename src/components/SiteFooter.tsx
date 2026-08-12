import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line py-6 text-center text-sm text-neutral-500">
      <div className="flex justify-center gap-6">
        <Link href="/terms" className="hover:text-neutral-400">
          Terms of Use
        </Link>
        <Link href="/privacy" className="hover:text-neutral-400">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
