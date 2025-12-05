# Bio Sculpture Ecommerce Website

A full-stack ecommerce website built with Next.js, TypeScript, PostgreSQL, and Stripe.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```
⚠️ **IMPORTANT:** Always use `migrate dev` instead of `db push` to prevent data loss!

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Product catalog with categories
- Shopping cart functionality
- User authentication
- Stripe payment integration
- Order management
- Admin panel for product and order management

