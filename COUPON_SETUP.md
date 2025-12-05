# Coupon Feature Setup Guide

This guide will help you set up the coupon feature in your admin panel.

## Database Setup

### Step 1: Run the Migration

The coupon feature requires a database migration. Run the following command to apply it:

```bash
npx prisma migrate dev --name add_coupons
```

This will:
- Create the `DiscountType` enum
- Create the `Coupon` table with all required fields
- Create necessary indexes for performance

### Step 2: Generate Prisma Client

After running the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### ⚠️ IMPORTANT: Never Use db push

**DO NOT use `npx prisma db push`** - it can delete all your data when schema changes are detected!

Always use migrations:
```bash
npx prisma migrate dev --name add_coupons
npx prisma generate
```

## Verification

To verify the setup is working:

1. **Check the database schema:**
   ```bash
   npx prisma studio
   ```
   Look for the `Coupon` table in the database viewer.

2. **Test creating a coupon:**
   - Login to admin panel
   - Navigate to `/admin/coupons`
   - Click "+ Add new"
   - Fill out the form and create a test coupon

## Coupon Validation Rules

The system enforces the following validation rules:

### Coupon Code
- Required field
- 3-50 characters
- Only letters, numbers, hyphens, and underscores
- Automatically converted to uppercase
- Must be unique

### Discount Value
- Required field
- Must be a positive number
- For percentage discounts: 0-100%
- For fixed discounts: any positive amount

### Usage Limits
- Optional total usage limit (positive integer)
- Optional per-user usage limit (positive integer)
- If set, must be at least 1

### Dates
- Valid from: Required, cannot be in the past (defaults to now)
- Valid until: Optional, must be after "valid from" date if set

### Other Fields
- Minimum purchase amount: Optional, must be non-negative
- Maximum discount amount: Optional, must be non-negative (useful for percentage discounts)
- Description: Optional text field

## Features

✅ Create coupons with percentage or fixed discounts  
✅ Set usage limits (total and per-user)  
✅ Set validity dates  
✅ Set minimum purchase requirements  
✅ Set maximum discount caps  
✅ Track usage count  
✅ Enable/disable coupons  
✅ Search and filter coupons  
✅ View coupon status (Active, Expired, Scheduled, Limit Reached)

## Troubleshooting

### Error: "Coupon table doesn't exist"
- Run the migration: `npx prisma migrate dev --name add_coupons`
- Generate Prisma client: `npx prisma generate`

### Error: "Coupon code already exists"
- The code must be unique. Try a different code or check existing coupons.

### Error: "Invalid discount value"
- Percentage discounts must be between 0-100
- Fixed discounts must be positive numbers
- Check that the value is a valid number

### Database connection issues
- Verify your `DATABASE_URL` in `.env.local` is correct
- Check that PostgreSQL is running
- Run: `npx prisma migrate dev --name test_connection` to test connection
- ⚠️ **NEVER use `db push`** - it can delete all your data!

## Next Steps

After setting up the database:
1. Create your first coupon in the admin panel
2. Test the coupon validation rules
3. Verify coupons are saved correctly in the database

The coupon feature is now ready to use! 🎉

