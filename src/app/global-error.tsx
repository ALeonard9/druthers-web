'use client';

const bodyStyle = {
  minHeight: '100vh',
  margin: 0,
  background: '#101014',
  color: '#f2ead8',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
} as const;

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        <main
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            minHeight: '100vh',
            maxWidth: '36rem',
            margin: '0 auto',
            padding: '2rem',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <title>Something went wrong | Druthers</title>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, ui-serif, serif' }}>
            Druthers hit a snag
          </h1>
          <p style={{ margin: 0, color: '#a3a3a3', lineHeight: 1.5 }}>
            The app could not finish loading. Try again to reconnect.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              border: 0,
              borderRadius: '0.25rem',
              background: '#c9a86a',
              color: '#1c1917',
              padding: '0.65rem 1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
