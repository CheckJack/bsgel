#!/usr/bin/env bash
# Trigger transactional email cron jobs (reviews, cart abandonment).
# Requires CRON_SECRET and NEXTAUTH_URL (or SITE_URL) in the environment.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env"
  set +a
fi

SECRET="${CRON_SECRET:-}"
BASE="${NEXTAUTH_URL:-${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}}"
BASE="${BASE%/}"

if [[ -z "$SECRET" ]]; then
  echo "CRON_SECRET is not set" >&2
  exit 1
fi

curl -sS -X POST \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  "${BASE}/api/cron/emails" | tee /dev/stderr
echo
