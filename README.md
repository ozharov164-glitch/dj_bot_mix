# MixFlow Mini App

Standalone Telegram Mini App frontend for MixFlow.

> This repository contains **only** the static frontend. Backend, bot, worker and secrets live in a private monorepo and are not published here.

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
# set VITE_API_URL to your local API origin (defaults to http://localhost:3000 in dev)
pnpm dev
```

Open inside Telegram with a bot Menu Button / Web App URL pointing at the Mini App. Outside Telegram the UI shows an error screen and does **not** fake-login.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest unit + component regressions |
| `pnpm build` | Production build (fail-closed API URL unless `VITE_ALLOW_DEV_API=true`) |

## GitHub Pages / deploy gate

CI always verifies lint/typecheck/test and a **CI-safe** build with
`VITE_ALLOW_DEV_API=true` + `http://localhost:3000`.

Functional Pages deployment requires:

1. Repository variable `ENABLE_PAGES_DEPLOY=true`
2. Repository variable `VITE_API_URL` = real public **HTTPS** API origin
   (not localhost, not `*.example.com` / `example.org` / `example.net`)

Until a real API exists, keep `ENABLE_PAGES_DEPLOY=false` and leave `VITE_API_URL`
unset. The static site may remain from an older deploy, but it will not be a
working product without a backend.

Expected URL after a valid production deploy:
`https://ozharov164-glitch.github.io/dj_bot_mix/`

## Security

- No bot tokens, session secrets, or `.env` files in this repo
- Bearer session tokens stay in memory only
- Production builds reject placeholder/example API hosts

## CI actions pinning

Workflow currently uses major version tags (`actions/checkout@v4`, etc.).
This is a **conscious residual risk**; prefer pinning to full commit SHAs with
Dependabot when hardening further.
