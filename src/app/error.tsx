'use client';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="font-display text-3xl text-paper">Something went wrong</h1>
      <p className="text-sm text-neutral-400">
        This page could not be loaded. Your lists are safe, and you can try the request again.
      </p>
      <button
        type="button"
        onClick={retry}
        className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        Try again
      </button>
    </main>
  );
}
