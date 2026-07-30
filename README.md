# MixFlow Mini App

Standalone Telegram Mini App frontend for MixFlow.

> This repository contains **only** the static frontend. Backend, bot, worker and secrets live in a private monorepo and are not published here.

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
# set VITE_API_URL to your local/public API origin
pnpm dev
```

Open inside Telegram with a bot Menu Button / Web App URL pointing at the Mini App. Outside Telegram the UI shows an error screen and does **not** fake-login.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript |
| `pnpm test` | Vitest regression tests |
| `pnpm build` | Production build |

## GitHub Pages

On GitHub Actions the Vite `base` becomes `/dj_bot_mix/`.

Set repository variable `VITE_API_URL` to the public API origin before relying on production Pages. Without it, CI still builds (fallback localhost), but the deployed app cannot talk to a real backend.

## Security

- No bot tokens, session secrets, or `.env` files in this repo
- Bearer session tokens stay in memory only
