# Database Setup Guide

## Quick Setup Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Or download from: https://www.postgresql.org/download/
   ```

2. **Create the database**:
   ```bash
   createdb bio_sculpture
   ```

3. **Update `.env.local`** with your connection string:
   ```env
   DATABASE_URL="postgresql://your_username@localhost:5432/bio_sculpture?schema=public"
   ```

4. **Initialize the database schema**:
   ```bash
   npx prisma migrate dev --name init
   ```
   ⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

### Option 2: Cloud Database (Recommended for Production)

Use a managed PostgreSQL service:
- **Supabase** (Free tier available): https://supabase.com
- **Neon** (Free tier available): https://neon.tech
- **Railway** (Free tier available): https://railway.app
- **AWS RDS**, **Google Cloud SQL**, etc.

Get the connection string from your provider and add it to `.env.local`.

### Option 3: Docker PostgreSQL (Easy Local Setup)

1. **Start PostgreSQL in Docker**:
   ```bash
   docker run --name bio-sculpture-db \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=bio_sculpture \
     -p 5432:5432 \
     -d postgres:14
   ```

2. **Update `.env.local`**:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bio_sculpture?schema=public"
   ```

3. **Initialize the database schema**:
   ```bash
   npx prisma migrate dev --name init
   ```
   ⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

## After Database Setup

1. **Initialize the database schema**:
   ```bash
   npx prisma migrate dev --name init
   ```
   ⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

2. **Create your first admin user**:
   - Start the server: `npm run dev`
   - Register at: http://localhost:3000/register
   - Open Prisma Studio: `npx prisma studio`
   - Find your user and change `role` from `USER` to `ADMIN`

3. **Start adding products**:
   - Login as admin
   - Go to `/admin` to manage products and categories

## Troubleshooting

- **Connection refused**: Make sure PostgreSQL is running
- **Authentication failed**: Check username/password in DATABASE_URL
- **Database doesn't exist**: Create it first with `createdb bio_sculpture`
- **Permission denied**: Check PostgreSQL user permissions

## Useful Commands

```bash
# View your database
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Create a new migration (for schema changes)
npx prisma migrate dev --name your_migration_name

# ⚠️ NEVER use "db push" - it can delete all your data!
```

