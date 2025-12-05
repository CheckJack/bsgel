#!/bin/bash

echo "🔍 Checking PostgreSQL for recovery options..."
echo ""

# Check if DATABASE_URL is set
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    exit 1
fi

source .env.local 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

# Extract database name from URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p' | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo ""

# Check PostgreSQL data directory (if local)
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
    echo "📁 Checking for PostgreSQL data directory..."
    
    # Common PostgreSQL data directories
    PGDATA_DIRS=(
        "/usr/local/var/postgres"
        "/opt/homebrew/var/postgres"
        "/var/lib/postgresql"
        "/Library/PostgreSQL/*/data"
        "~/.postgres"
    )
    
    for dir in "${PGDATA_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            echo "✅ Found PostgreSQL data: $dir"
            if [ -d "$dir/pg_wal" ]; then
                echo "   📦 WAL directory exists (Write-Ahead Logging enabled)"
                WAL_COUNT=$(find "$dir/pg_wal" -name "*.wal" -o -name "*.xlog" 2>/dev/null | wc -l)
                echo "   📊 WAL files found: $WAL_COUNT"
            fi
        fi
    done
fi

echo ""
echo "💡 Recovery Options:"
echo "   1. Check PostgreSQL logs: /usr/local/var/log/postgres.log (or similar)"
echo "   2. Check for pg_dump backups you may have created"
echo "   3. If using Homebrew PostgreSQL, check: brew services list"
echo "   4. Check Time Machine backups (macOS) for database files"
echo ""
echo "⚠️  If you have a backup file, restore with:"
echo "   psql -d $DB_NAME < backup_file.sql"

