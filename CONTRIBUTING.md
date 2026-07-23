# Contributing

This repo follows the shared druthers.io SDLC — see
[`SDLC.md`](https://github.com/ALeonard9/druthers-api/blob/main/SDLC.md) in the
API repo (canonical).

## TL;DR

- **Branches**: `main` is protected. Work on short-lived `feat/…`, `fix/…`, or
  `chore/…` branches; open a PR; merge when CI is green (squash).
- **Before pushing**: `npm run lint && npm run typecheck && npm run test && npm run build`.
- **Pre-commit**: `pre-commit install` runs eslint/typecheck/vitest on commit.
- **Commits**: imperative subject; explain the *why* in the body.

## Local setup

```bash
npm install
npm run dev
```

Defaults to a `druthers-api` on `http://127.0.0.1:8000`. To point elsewhere, set
`API_BASE_URL` in a root-level `.env.local` (Next.js loads it automatically; not
committed).
