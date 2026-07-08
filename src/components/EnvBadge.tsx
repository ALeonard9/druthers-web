// Visible environment label so it's always obvious which stage this is.
// Driven by NEXT_PUBLIC_APP_ENV (dev | qa | prod). Prod shows nothing.
const STYLES: Record<string, string> = {
  dev: 'bg-amber-500 text-black',
  qa: 'bg-sky-500 text-black',
};

export function EnvBadge() {
  const env = (process.env.NEXT_PUBLIC_APP_ENV ?? 'dev').toLowerCase();
  if (env === 'prod' || env === 'production') return null;
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
        STYLES[env] ?? 'bg-neutral-600 text-white'
      }`}
      title={`This is the ${env.toUpperCase()} environment`}
    >
      {env}
    </span>
  );
}
