# Ban List Feature Implementation

## Overview

This feature allows administrators to ban customer emails from creating orders or registering new accounts on the website. When an email is added to the ban list, the user cannot:
- Create new orders
- Create a new account with that email address

## Database Changes

A new `BannedEmail` model has been added to the Prisma schema with the following structure:
- `id`: Unique identifier
- `email`: Banned email address (unique)
- `reason`: Optional reason for the ban
- `bannedBy`: Admin user ID who banned the email
- `createdAt`: Timestamp when the email was banned
- `updatedAt`: Timestamp of last update

## Implementation Details

### 1. Database Schema (`prisma/schema.prisma`)
- Added `BannedEmail` model to track banned emails

### 2. API Endpoints

#### `/api/banned-emails` (GET)
- Lists all banned emails
- Admin only

#### `/api/banned-emails` (POST)
- Adds an email to the ban list
- Requires `email` and optional `reason`
- Admin only

#### `/api/banned-emails` (DELETE)
- Removes an email from the ban list
- Requires `email` query parameter
- Admin only

### 3. Registration Protection (`/api/auth/register`)
- Checks if email is banned before allowing registration
- Returns 403 error if email is banned

### 4. Order Protection
- `/api/orders` (POST): Checks if user's email is banned before creating order
- `/api/payments/create-intent`: Checks if user's email is banned before creating payment intent

### 5. Admin UI (`/admin/customers`)
- Added ban/unban buttons in the actions column
- Shows visual indicator (red badge) for banned customers
- Ban modal allows adding optional reason
- Banned customers have a red border and background highlight

## Setup Instructions

### 1. Apply Database Migration

⚠️ **IMPORTANT:** Always use migrations to prevent data loss!

Run the following command to create and apply the migration:

```bash
npx prisma migrate dev --name add_banned_emails
```

**DO NOT use `npx prisma db push`** - it can delete all your data when schema changes are detected!

### 2. Generate Prisma Client

After applying the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### 3. Restart the Development Server

Restart your Next.js development server to ensure all changes are loaded:

```bash
npm run dev
```

## Usage

### Banning a Customer

1. Navigate to `/admin/customers`
2. Find the customer you want to ban
3. Click the ban icon (🚫) in the Actions column
4. Optionally add a reason for the ban
5. Click "Ban Customer" to confirm

### Unbanning a Customer

1. Navigate to `/admin/customers`
2. Find the banned customer (they will have a red badge)
3. Click the unban icon (✓) in the Actions column
4. The customer will be immediately unbanned

### Visual Indicators

- **Banned customers** are highlighted with:
  - Red left border
  - Red background tint
  - "Banned" badge next to their email
  - Unban button instead of ban button

## Testing

To test the feature:

1. **Test Registration Block**:
   - Ban an email address
   - Try to register with that email
   - Should receive error: "This email address is not allowed to create an account..."

2. **Test Order Block**:
   - Log in with a user account
   - Ban that user's email from admin panel
   - Try to create an order
   - Should receive error: "Your account is banned. You cannot place orders..."

3. **Test Unban**:
   - Unban a previously banned email
   - User should be able to place orders again

## Security Notes

- Only admin users can ban/unban emails
- All email checks are case-insensitive
- Emails are normalized (lowercase, trimmed) before checking
- Banned users cannot bypass the ban by using different email casing

## Files Modified/Created

### Created Files:
- `app/api/banned-emails/route.ts` - API endpoint for managing banned emails

### Modified Files:
- `prisma/schema.prisma` - Added BannedEmail model
- `app/api/auth/register/route.ts` - Added ban check
- `app/api/orders/route.ts` - Added ban check
- `app/api/payments/create-intent/route.ts` - Added ban check
- `app/admin/customers/page.tsx` - Added ban/unban UI

## Future Enhancements

Possible improvements:
- Bulk ban/unban functionality
- Ban history/audit log
- Temporary bans with expiration dates
- Ban by domain (e.g., ban all emails from a specific domain)
- Email notifications when a user is banned/unbanned

