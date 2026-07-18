'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Minimal typing for the Google Identity Services global.
interface GoogleCredentialResponse {
  credential: string;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignIn({ clientId }: { clientId: string }) {
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    async function onCredential(resp: GoogleCredentialResponse) {
      setError(null);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: resp.credential }),
      });
      if (res.ok) {
        router.push('/movies');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Google sign-in failed. Try again.');
    }

    function init() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280,
      });
    }

    if (window.google) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [clientId, router]);

  if (!clientId) {
    return (
      <p className="text-sm text-amber-400">
        Google sign-in isn’t configured (set NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={btnRef} className="flex justify-center" />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
