#!/bin/bash

# DATABASE BACKUP SCRIPT
# This script creates a backup of your database before any operations

echo "💾 Creating database backup..."

# Load environment variables
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    exit 1
fi

source .env.local 2>/dev/null || export $(grep -v '^#' .env.local | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

# Extract database name
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backups directory
BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "📦 Backing up database: $DB_NAME"
echo "   To: $BACKUP_FILE"

# Create backup using pg_dump
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    
    # Keep only last 10 backups
    cd "$BACKUP_DIR"
    ls -t backup_*.sql | tail -n +11 | xargs rm -f 2>/dev/null
    cd ..
    
    echo "💾 Backup complete!"
else
    echo "❌ Backup failed!"
    exit 1
fi

