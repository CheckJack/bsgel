# Bio Sculpture Ecommerce - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Stripe account (for payments)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/bio_sculpture?schema=public"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

   To generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

3. **Set Up Database**
   
   Initialize the database schema with a migration:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
   ⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

4. **Create an Admin User** (Optional)
   
   You can create an admin user manually in the database or via Prisma Studio:
   ```bash
   npx prisma studio
   ```
   
   Set the `role` field to `ADMIN` for the user you want to be admin.

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe Dashboard
3. For webhooks in development, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   Copy the webhook signing secret and add it to your `.env.local` file.

## Features Implemented

- ✅ User authentication (NextAuth.js)
- ✅ Product catalog with categories
- ✅ Shopping cart functionality
- ✅ Stripe payment integration
- ✅ Order management
- ✅ User dashboard with order history
- ✅ Admin panel for:
  - Product management (CRUD)
  - Category management
  - Order management
  - Dashboard with statistics

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components (UI, layout, product, cart)
- `/lib` - Utilities and configurations (db, auth, stripe)
- `/prisma` - Database schema
- `/public` - Static assets

## Next Steps

1. Add your product images to the `public` folder or use image URLs
2. Create product categories via the admin panel
3. Add products via the admin panel
4. Test the checkout flow with Stripe test cards
5. Configure production environment variables
6. Deploy to Vercel or your preferred hosting platform

## Test Cards (Stripe)

Use these test card numbers for testing:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

Use any future expiry date, any CVC, and any ZIP code.

