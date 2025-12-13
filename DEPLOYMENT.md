# 🚀 Production Deployment Guide

This guide will help you deploy the Bio Sculpture Ecommerce application to a live production environment.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed on your server
- ✅ PostgreSQL database (production-ready)
- ✅ Domain name configured with DNS
- ✅ SSL certificate (HTTPS required for production)
- ✅ Stripe account with production API keys
- ✅ Environment variables configured

---

## 🔧 Step 1: Environment Variables

Create a `.env.local` file (or set environment variables in your hosting platform) with the following:

### Required Variables

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL="postgresql://username:password@your-db-host:5432/bio_sculpture?schema=public"

# ============================================
# NEXTAUTH CONFIGURATION (CRITICAL)
# ============================================
# IMPORTANT: Must be your actual production domain with https://
NEXTAUTH_URL="https://yourdomain.com"

# Generate a strong secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-production-secret-here"

# ============================================
# STRIPE CONFIGURATION
# ============================================
# Use LIVE keys from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # From Stripe Dashboard > Webhooks

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV="production"
```

### ⚠️ Critical Notes:

1. **NEXTAUTH_URL**: Must match your exact production domain (including https://)
2. **NEXTAUTH_SECRET**: Generate a new, unique secret for production
3. **Stripe Keys**: Switch from test keys to live keys
4. **Database**: Use a production database, not localhost

---

## 🗄️ Step 2: Database Setup

### 2.1 Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Verify connection
npm run db:check
```

### 2.2 Create Admin User

```bash
# Option 1: Use the script
npm run create-admin

# Option 2: Use Prisma Studio (if accessible)
npx prisma studio
# Then manually set a user's role to "ADMIN"
```

---

## 🏗️ Step 3: Build the Application

```bash
# Install dependencies
npm ci  # Use ci for production (clean install)

# Build the application
npm run build

# Verify build succeeded
# You should see: "✓ Compiled successfully"
```

---

## 🚀 Step 4: Start the Production Server

### Option A: Using npm start (Recommended)

```bash
# Set PORT if needed (defaults to 3000)
export PORT=3000

# Start production server
npm run start:prod
```

### Option B: Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "bio-sculpture" -- run start:prod

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

### Option C: Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Update `next.config.js` to enable standalone output:

```js
const nextConfig = {
  output: 'standalone', // Add this
  // ... rest of config
}
```

---

## 🌐 Step 5: Configure Reverse Proxy (Nginx)

If using Nginx as a reverse proxy, here's a sample configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts for long-running requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

---

## 🔒 Step 6: Security Checklist

Before going live, verify:

- [ ] **HTTPS is enabled** (SSL certificate installed)
- [ ] **NEXTAUTH_URL** matches your production domain exactly
- [ ] **NEXTAUTH_SECRET** is a strong, unique value
- [ ] **Database credentials** are secure and not exposed
- [ ] **Stripe keys** are production keys (not test keys)
- [ ] **Environment variables** are set in production (not in code)
- [ ] **Firewall** is configured (only necessary ports open)
- [ ] **Database backups** are configured
- [ ] **Error logging** is set up (e.g., Sentry, LogRocket)

---

## 📊 Step 7: Stripe Webhook Configuration

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## ✅ Step 8: Post-Deployment Verification

Test the following:

1. **Homepage loads**: `https://yourdomain.com`
2. **Authentication works**: Login/Register
3. **Products display**: Browse products
4. **Cart functionality**: Add items to cart
5. **Checkout process**: Complete a test order
6. **Admin panel**: Access `/admin` (admin user required)
7. **API routes**: Test key endpoints
8. **Images load**: Verify image optimization works
9. **SSL certificate**: Browser shows secure connection

---

## 🔄 Step 9: Continuous Deployment (Optional)

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to server
        # Add your deployment steps here
```

---

## 🐛 Troubleshooting

### Issue: "NEXTAUTH_URL mismatch"
**Solution**: Ensure `NEXTAUTH_URL` exactly matches your domain (including https://)

### Issue: Database connection fails
**Solution**: 
- Verify `DATABASE_URL` is correct
- Check database firewall allows your server IP
- Ensure database is accessible from your server

### Issue: Images not loading
**Solution**: 
- Check `next.config.js` image configuration
- Verify image domains are allowed
- Check CORS settings

### Issue: Stripe payments fail
**Solution**:
- Verify you're using production Stripe keys
- Check webhook endpoint is accessible
- Verify webhook secret is correct

### Issue: Build fails
**Solution**:
- Run `npm ci` instead of `npm install`
- Clear `.next` folder: `rm -rf .next`
- Check Node.js version matches (18+)

---

## 📝 Maintenance

### Regular Tasks

1. **Database Backups**: Run daily backups
   ```bash
   npm run db:backup
   ```

2. **Update Dependencies**: Regularly update packages
   ```bash
   npm update
   npm run build  # Test after updates
   ```

3. **Monitor Logs**: Check application logs regularly
   ```bash
   # If using PM2
   pm2 logs bio-sculpture
   ```

4. **Database Migrations**: Apply new migrations
   ```bash
   npx prisma migrate deploy
   ```

---

## 🆘 Support

If you encounter issues:

1. Check application logs
2. Verify environment variables
3. Test database connection
4. Review Next.js build output
5. Check browser console for frontend errors

---

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Stripe Production Checklist](https://stripe.com/docs/keys)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0

