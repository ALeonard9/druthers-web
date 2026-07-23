# Druthers Web

> **[Druthers](https://druthers.io)** is social taste-sharing for the things you love —
> **Movies, TV, Books, and Games**. Track what you've watched, played, and read;
> share a formatted top-5; and find the overlap with a friend.

## What this is

The **web app** — a Next.js frontend for druthers.io, with a backend-for-frontend
(BFF) layer that keeps your session token off the client entirely. It talks to
[`druthers-api`](https://github.com/ALeonard9/druthers-api) and runs serverless on
**Google Cloud Run**.

- **Sign in with Google**, then track and rate across all four domains
- **Secure by design** — a BFF layer (`src/app/api/*`) proxies the API and keeps the
  JWT in an **httpOnly cookie**, so the token never reaches client JavaScript
- **Tested** — Vitest (unit) + Playwright (E2E), run in CI on every PR

## Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) · [React 19](https://react.dev/) · TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Auth | Google OAuth · JWT in an httpOnly cookie, attached server-side by the BFF |
| Testing | [Vitest](https://vitest.dev/) (unit) · [Playwright](https://playwright.dev/) (E2E) |
| Runtime | Docker (standalone Next.js build) on **Cloud Run** |
| CI/CD & security | GitHub Actions · Gitleaks · Semgrep · Trivy · Dependabot |

## Setup / Local Development

Requires [`druthers-api`](https://github.com/ALeonard9/druthers-api) running locally
(defaults to `http://127.0.0.1:8000`).

```bash
npm install
npm run dev                       # http://localhost:3000
```

No env file is required for the default local setup — the app falls back to
`http://127.0.0.1:8000` for the API. To point at a different backend, add
`API_BASE_URL=...` to a root-level `.env.local` (Next.js loads it automatically;
not committed).

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (standalone) |
| `npm run lint` / `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run test` / `npm run test:e2e` | Vitest · Playwright |

**Pre-commit** runs Gitleaks + ESLint + typecheck on every commit; **tests run at
_pre-push_** on only the files that changed (`vitest related`). CI runs the full
suite as the merge gate.

## Architecture

```
Browser ──▶ Next.js BFF (httpOnly cookie) ──▶ druthers-api /v1 ──▶ Neon Postgres
```

Server components read your library directly; client components call same-origin
BFF routes (`/api/*`) that attach the bearer token server-side.

## Deploy

`Dockerfile` builds a hardened, non-root **standalone** image; on GitHub release it
publishes to GHCR and deploys to **Cloud Run** (see
[`druthers-infra`](https://github.com/ALeonard9/druthers-infra)).

## Security

OSS scanning on every PR — Gitleaks, Semgrep, Trivy, and Dependabot — with GitHub
push protection. See [`SECURITY.md`](https://github.com/ALeonard9/.github/blob/main/SECURITY.md).

## Related repos

- **[druthers-api](https://github.com/ALeonard9/druthers-api)** — FastAPI backend; source of truth for library data, auth, and search.
- **[druthers-mcp](https://github.com/ALeonard9/druthers-mcp)** — MCP server that lets Claude and other assistants manage your library.
- **[druthers-infra](https://github.com/ALeonard9/druthers-infra)** — infrastructure-as-code and ops runbooks (private repo).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).
