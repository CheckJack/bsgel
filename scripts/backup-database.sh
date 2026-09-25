#!/usr/bin/env bash
# DATABASE BACKUP SCRIPT
# Creates a pg_dump backup before risky operations.
# Loads env from .env and/or .env.local (local overrides .env).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "💾 Creating database backup..."

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

# Prefer production .env; allow .env.local overrides (Next.js convention)
if [[ ! -f "$ROOT/.env" && ! -f "$ROOT/.env.local" ]]; then
  echo "❌ Neither .env nor .env.local found in $ROOT"
  exit 1
fi

load_env_file "$ROOT/.env"
load_env_file "$ROOT/.env.local"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL not set (check .env / .env.local)"
  exit 1
fi

# Extract database name from URL path
DB_NAME="$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^/?]*\).*/\1/p')"
if [[ -z "$DB_NAME" ]]; then
  DB_NAME="database"
fi

BACKUP_DIR="$ROOT/database-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "📦 Backing up database: $DB_NAME"
echo "   To: $BACKUP_FILE"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "❌ pg_dump not found. Install PostgreSQL client tools."
  exit 1
fi

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
  BACKUP_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
  echo "✅ Backup created successfully!"
  echo "   File: $BACKUP_FILE"
  echo "   Size: $BACKUP_SIZE"

  # Keep only last 10 backups
  ls -1t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +11 | while read -r old; do
    rm -f "$old"
  done

  echo "💾 Backup complete!"
else
  echo "❌ Backup failed!"
  rm -f "$BACKUP_FILE"
  exit 1
fi
