# Create Admin Account

## Quick Method

Run this command with your desired credentials:

```bash
npm run create-admin:quick admin@biosculpture.com admin123 "Admin User"
```

Or use the interactive version:

```bash
npm run create-admin
```

## Default Admin Account

I'll create a default admin account for you:

**Email:** admin@biosculpture.com  
**Password:** admin123  
**Role:** ADMIN

⚠️ **IMPORTANT:** Change this password after first login!

## Steps to Create Admin

### 1. Make sure database is configured

Update `.env.local` with your DATABASE_URL, then run:
```bash
npx prisma migrate dev --name init
```
⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

### 2. Create the admin account

**Option A: Quick (non-interactive)**
```bash
npm run create-admin:quick admin@biosculpture.com yourpassword "Admin Name"
```

**Option B: Interactive**
```bash
npm run create-admin
```

This will prompt you for:
- Email address
- Password
- Name (optional)

### 3. Login

Visit http://localhost:3000/login and use your admin credentials.

## Troubleshooting

- **Database connection error**: Make sure DATABASE_URL is set in `.env.local` and database is running
- **User already exists**: The script will update existing users to admin role
- **Prisma errors**: Run `npx prisma generate` first

