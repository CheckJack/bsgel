#!/usr/bin/env bash
# Safe production deploy for Bio Sculpture (PM2).
# CRITICAL: never wipe public/uploads — product/blog/gallery media lives there.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOADS_DIR="$ROOT/public/uploads"
UPLOADS_MARKER="$UPLOADS_DIR/.deploy-keep"
APP_NAME="${PM2_APP_NAME:-bio-sculpture}"

echo "==> Deploy starting in $ROOT"

if [[ ! -d "$UPLOADS_DIR" ]]; then
  echo "⚠️  Creating public/uploads (was missing)"
  mkdir -p "$UPLOADS_DIR"
fi
# Touch marker so empty-dir logic never deletes the tree by accident
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$UPLOADS_MARKER"

# Snapshot inode/count for post-build sanity check
UPLOADS_BEFORE="$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')"
echo "==> public/uploads file count before build: $UPLOADS_BEFORE"

echo "==> Installing deps (npm ci, including devDeps needed for build)"
# NODE_ENV=production would skip tailwind/postcss/typescript — break the build
NODE_ENV=development npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Applying migrations (prisma migrate deploy)"
npx prisma migrate deploy

echo "==> Building Next.js"
# Explicitly do NOT run: rm -rf public/uploads  (media must survive deploys)
npm run build

UPLOADS_AFTER="$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')"
echo "==> public/uploads file count after build: $UPLOADS_AFTER"

if [[ ! -d "$UPLOADS_DIR" ]]; then
  echo "❌ FATAL: public/uploads disappeared during deploy"
  exit 1
fi

if [[ "$UPLOADS_AFTER" -lt "$UPLOADS_BEFORE" ]]; then
  echo "❌ FATAL: public/uploads lost files during deploy ($UPLOADS_BEFORE → $UPLOADS_AFTER)"
  exit 1
fi

echo "==> Restarting PM2 app: $APP_NAME"
pm2 restart "$APP_NAME" --update-env

echo "✅ Deploy complete. Uploads preserved ($UPLOADS_AFTER files)."
