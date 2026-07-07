# aleonard.us-web

The web frontend for [aleonard.us](https://www.aleonard.us) — a Next.js app that
consumes the [`aleonard.us-api`](https://github.com/ALeonard9/aleonard.us-api)
backend. First slice: **Movies** (list, watched/watchlist, notes, search & add).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Backend-for-Frontend (BFF)**: route handlers under `src/app/api/*` proxy the
  API and keep the JWT in an **httpOnly cookie** — the token never reaches
  client JavaScript.
- **Vitest** (unit) + **Playwright** (smoke E2E)
- Containerized (standalone output) and published to **GHCR** on release.

## Architecture

```
Browser ──▶ Next.js (BFF route handlers) ──▶ aleonard.us-api /v1 ──▶ Postgres
             stores JWT in httpOnly cookie
```

Server components read `GET /v1/users/me/movies` directly; client components call
same-origin BFF routes (`/api/movies/*`) which attach the bearer token.

## Develop

```bash
npm install
cp .env.example .env.local     # API_BASE_URL=http://127.0.0.1:8000
npm run dev                    # http://localhost:3000
```

Requires the API running (see the api repo). Sign in with an API user; the
Movies page renders that user's tracked movies.

## Scripts / tasks

| Command | Purpose |
|---------|---------|
| `npm run dev` / `task dev` | Dev server |
| `npm run build` | Production build (standalone) |
| `npm run lint` / `task lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` / `task test` | Vitest unit tests |
| `npm run test:e2e` / `task e2e` | Playwright smoke |
| `task du -- prod` | Run the container via compose |

## Environment

| Var | Description |
|-----|-------------|
| `API_BASE_URL` | Base URL of `aleonard.us-api` (server-side only) |
| `LZ` / `ENV` | Landing zone (`m3`/`gs`) and environment, for compose templating |

## Deploy

`Dockerfile` builds a standalone non-root image; `publish_docker.yaml` pushes to
`ghcr.io/aleonard9/aleonard.us-web` on GitHub release. Runs on the homelab behind
the Cloudflare tunnel alongside the API (see `www.aleonard.us-docker`).
