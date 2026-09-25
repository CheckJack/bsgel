# Ops notes (Bio Sculpture)

## Env files
- Production loads **`.env`** (PM2 / Next).
- **`.env.local`** overrides `.env` when present (local/dev).
- `npm run db:backup` accepts either file (`.env` then `.env.local`).

## Database
- Prefer **`npx prisma migrate deploy`** in production (also run by `npm run deploy`).
- Migration history lives in **`prisma/migrations/`** and is tracked in git.
- Backups: `npm run db:backup` → `database-backups/` (gitignored). Keep last 10 automatically.

## Uploads (critical)
- Product / blog / gallery media: **`public/uploads/`**.
- Contents are gitignored; directory kept via `public/uploads/.gitkeep`.
- **Never delete `public/uploads` on deploy.** Use `npm run deploy` which refuses to continue if files disappear.
- Serving path: `/uploads/*` → `/api/media/*` rewrite.

## Sentry
- Optional. Set `NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_DSN` for server) to enable.
- Source maps: also set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- Without a DSN the SDK stays disabled and builds still succeed.

## Deploy
```bash
npm run deploy
# or: bash scripts/deploy.sh
```
Runs: `npm ci` (with `NODE_ENV=development` so build tooling like Tailwind is installed) → `prisma generate` → `migrate deploy` → `build` → `pm2 restart bio-sculpture --update-env`, with uploads integrity check.

If you run `npm ci` yourself while `NODE_ENV=production`, use `npm ci --include=dev` before `npm run build`.
