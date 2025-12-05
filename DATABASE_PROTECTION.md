# 🛡️ DATABASE PROTECTION POLICY

## ⚠️ CRITICAL: DATABASE IS PROTECTED - NO DATA DELETION ALLOWED

**THE DATABASE IS UNTOUCHABLE. NO DATA CAN BE DELETED.**

## 🔒 Protection Measures Implemented

### 1. ✅ Removed Dangerous Operations from start.sh
- **REMOVED**: `npx prisma db push` from automatic startup
- **PROTECTED**: Database schema will NEVER be modified automatically
- **SAFE**: Only connection checks are performed

### 2. ✅ Disabled Dangerous Scripts
- **DISABLED**: `npm run db:push` - Now shows warning and exits
- **PROTECTED**: No automatic schema changes
- **SAFE**: All database operations require explicit confirmation

### 3. ✅ Automatic Backups
- **ENABLED**: Automatic backup before any database operations
- **LOCATION**: `./database-backups/`
- **RETENTION**: Last 10 backups kept automatically

## 🚫 FORBIDDEN COMMANDS (NEVER USE)

These commands **WILL DELETE ALL DATA**:

```bash
❌ npx prisma db push --accept-data-loss
❌ npx prisma db push --force-reset
❌ npx prisma migrate reset
❌ npm run db:push (now disabled)
```

## ✅ SAFE Commands (Use These Instead)

For schema changes, **ALWAYS** use migrations:

```bash
✅ npx prisma migrate dev --name your_migration_name
✅ npx prisma migrate deploy (production)
✅ npx prisma generate (safe - only generates client)
✅ npx prisma studio (safe - only views data)
```

## 📋 Database Contents (PROTECTED)

All of these are **PROTECTED** and **MUST NEVER BE DELETED**:

- ✅ **Users** - All backend users and customers
- ✅ **Products** - All product data
- ✅ **Categories** - All category data
- ✅ **Attributes** - All attribute data
- ✅ **Salons** - All salon locations
- ✅ **Messages** - All chat messages
- ✅ **Orders** - All order history
- ✅ **Carts** - All shopping cart data
- ✅ **Blogs** - All blog posts
- ✅ **Gallery** - All gallery items
- ✅ **Notifications** - All notifications
- ✅ **Social Media Posts** - All social media content

## 💾 Backup Strategy

### Automatic Backups
Before any database operation, a backup is created in:
```
./database-backups/backup_bio_sculpture_YYYYMMDD_HHMMSS.sql
```

### Manual Backup
To create a manual backup:
```bash
npm run db:backup
```

### Restore from Backup
If you need to restore:
```bash
psql -d bio_sculpture < database-backups/backup_bio_sculpture_YYYYMMDD_HHMMSS.sql
```

## 🔐 Protection Rules

1. **NO automatic schema changes** - Removed from start.sh
2. **NO data loss flags** - All dangerous flags disabled
3. **Automatic backups** - Before any operation
4. **Migration-only changes** - Use `prisma migrate dev` only
5. **Explicit confirmation** - All destructive operations require confirmation

## ⚠️ If You Need to Make Schema Changes

1. **Create a migration**:
   ```bash
   npx prisma migrate dev --name your_change_name
   ```

2. **Review the migration** in `prisma/migrations/`

3. **Test in development** first

4. **Deploy to production**:
   ```bash
   npx prisma migrate deploy
   ```

## 🚨 Emergency Recovery

If data is lost (should never happen with these protections):

1. Check `./database-backups/` for recent backups
2. Restore from backup:
   ```bash
   psql -d bio_sculpture < database-backups/backup_bio_sculpture_YYYYMMDD_HHMMSS.sql
   ```

## 📝 Summary

- ✅ Database is **PROTECTED**
- ✅ No automatic schema changes
- ✅ Automatic backups enabled
- ✅ Dangerous commands disabled
- ✅ All data is **SAFE**

**THE DATABASE IS UNTOUCHABLE. NO DATA WILL BE DELETED.**

