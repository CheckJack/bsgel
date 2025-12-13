# Environment Variables Reference

This file documents all required and optional environment variables for the Bio Sculpture Ecommerce application.

## 📋 Required Variables

### Database
```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```
- **Description**: PostgreSQL connection string
- **Production**: Use your production database URL
- **Development**: `postgresql://user:password@localhost:5432/bio_sculpture?schema=public`

### NextAuth
```env
NEXTAUTH_URL="https://yourdomain.com"
```
- **Description**: Base URL of your application
- **Production**: Must be your exact production domain with `https://`
- **Development**: `http://localhost:3000` (or your dev port)
- **⚠️ Critical**: Must match your actual domain exactly

```env
NEXTAUTH_SECRET="your-secret-key"
```
- **Description**: Secret key for encrypting JWT tokens
- **Generate**: `openssl rand -base64 32`
- **⚠️ Critical**: Use a strong, unique secret in production

### Stripe
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```
- **Description**: Stripe publishable key (safe for frontend)
- **Production**: Use live key from https://dashboard.stripe.com/apikeys
- **Development**: Use test key (`pk_test_...`)

```env
STRIPE_SECRET_KEY="sk_live_..."
```
- **Description**: Stripe secret key (server-side only)
- **Production**: Use live key from https://dashboard.stripe.com/apikeys
- **Development**: Use test key (`sk_test_...`)
- **⚠️ Security**: Never expose this in frontend code

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```
- **Description**: Webhook signing secret from Stripe
- **Get from**: Stripe Dashboard > Webhooks > Your endpoint
- **Development**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

### Node Environment
```env
NODE_ENV="production"
```
- **Description**: Application environment
- **Values**: `production` or `development`
- **Production**: Must be set to `production`

---

## 🔧 Optional Variables

### Port Configuration
```env
PORT=3000
```
- **Description**: Port for the Next.js server
- **Default**: 3000
- **Note**: Some hosting platforms set this automatically

---

## 📝 Example Files

### Development (.env.local)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bio_sculpture?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NODE_ENV="development"
```

### Production
```env
DATABASE_URL="postgresql://prod_user:secure_password@db.example.com:5432/bio_sculpture?schema=public"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="strong-production-secret-generated-with-openssl"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NODE_ENV="production"
PORT=3000
```

---

## ⚠️ Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different secrets** for development and production
3. **Rotate secrets** periodically, especially if compromised
4. **Use environment variables** in your hosting platform, not hardcoded values
5. **Restrict database access** to only your application server
6. **Use strong passwords** for database connections
7. **Enable SSL/TLS** for database connections in production

---

## 🔍 Verification

To verify your environment variables are set correctly:

```bash
# Check if variables are loaded (in Node.js)
node -e "console.log(process.env.NEXTAUTH_URL)"
node -e "console.log(process.env.DATABASE_URL ? 'Database URL set' : 'Database URL missing')"
```

---

## 🆘 Troubleshooting

### Variable not loading?
- Ensure file is named `.env.local` (not `.env`)
- Restart your development server after changes
- Check for typos in variable names
- Verify no extra spaces around `=`

### Production issues?
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check all required variables are set in hosting platform
- Ensure `NODE_ENV=production` is set
- Verify database is accessible from your server

---

**Last Updated**: 2025-01-15

