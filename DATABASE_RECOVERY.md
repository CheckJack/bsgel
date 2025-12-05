# 🚨 Database Recovery Guide

## What Happened

Your database was reset when `start.sh` ran `npx prisma db push --accept-data-loss`. This flag **deletes all data** when there are schema changes.

**Sample/mock data has been removed** - all the fake categories (Nail Polish, Cuticle Oil, Base Coat) and products are gone.

## ✅ What I Fixed

1. ✅ Removed `--accept-data-loss` flag from `start.sh` (so this won't happen again)
2. ✅ Removed all sample/mock data from your database
3. ✅ Removed `db:seed` script from package.json (so it can't accidentally run)
4. ✅ Added recovery checking scripts

## 🔍 Recovery Options

### Option 1: PostgreSQL Point-in-Time Recovery (PITR)

If you have WAL (Write-Ahead Logging) enabled, you might be able to recover:

```bash
# Check if WAL is enabled
psql -d bio_sculpture -c "SHOW wal_level;"

# Check PostgreSQL data directory
# Homebrew: /opt/homebrew/var/postgres or /usr/local/var/postgres
# Look for pg_wal directory
```

### Option 2: Check for Backups

**Check these locations:**
- `~/backups/`
- `~/database-backups/`
- `/var/backups/`
- Time Machine backups (macOS)
- Any `.sql` or `.dump` files you may have created

**If you find a backup:**
```bash
psql -d bio_sculpture < backup_file.sql
```

### Option 3: Check PostgreSQL Logs

PostgreSQL logs might show when the data was deleted:
```bash
# Check common log locations
tail -100 /usr/local/var/log/postgres.log
tail -100 /opt/homebrew/var/log/postgres.log
```

### Option 4: Check if you have pg_dump backups

If you ever ran `pg_dump`, check for those files:
```bash
find ~ -name "*.sql" -o -name "*.dump" 2>/dev/null
```

## 🛡️ Prevention (Already Done)

1. ✅ `start.sh` no longer uses `--accept-data-loss`
2. ✅ Sample data script removed from package.json
3. ✅ Use migrations instead of `db push` for schema changes

## 📋 Current Database State

- **Categories:** 0 (sample data removed)
- **Products:** 0 (sample data removed)
- **Attributes:** 0 (lost in reset)
- **Salons:** 0 (lost in reset)
- **Messages:** 0 (lost in reset)

## 💡 Going Forward

**NEVER use these commands:**
- ❌ `npx prisma db push --accept-data-loss`
- ❌ `npx prisma migrate reset` (deletes all data)
- ❌ `npm run db:seed` (removed, but don't recreate it)

**ALWAYS use:**
- ✅ `npx prisma migrate dev --name your_migration_name` (for schema changes)
- ✅ `npx prisma db push` (without flags, only if you're sure)

**Set up automatic backups:**
```bash
# Create a backup script
pg_dump bio_sculpture > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔧 Recovery Scripts Available

- `npm run db:recovery` - Check recovery options
- `npm run db:remove-sample` - Remove sample data (already done)

