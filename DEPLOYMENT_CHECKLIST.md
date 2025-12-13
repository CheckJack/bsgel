# ✅ Production Deployment Checklist

Use this checklist to ensure your application is ready for production deployment.

## 🔧 Pre-Deployment Configuration

### Configuration Files
- [x] **next.config.js** - Updated with production optimizations
  - [x] Removed localhost from image domains
  - [x] Added security headers
  - [x] Enabled production optimizations (reactStrictMode, swcMinify)

### Code Changes
- [x] **app/api/affiliate/route.ts** - Fixed hardcoded localhost fallback
- [x] **package.json** - Added production start script

### Documentation
- [x] **DEPLOYMENT.md** - Complete deployment guide created
- [x] **ENV_VARIABLES.md** - Environment variables reference created
- [x] **DEPLOYMENT_CHECKLIST.md** - This checklist

---

## 📋 Environment Variables Setup

### Required Variables
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Production domain (e.g., `https://yourdomain.com`)
- [ ] `NEXTAUTH_SECRET` - Strong secret (generate with `openssl rand -base64 32`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe live publishable key
- [ ] `STRIPE_SECRET_KEY` - Stripe live secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `NODE_ENV` - Set to `production`

### Verification
- [ ] All environment variables are set in hosting platform
- [ ] No environment variables are hardcoded in source code
- [ ] `.env.local` is NOT committed to version control

---

## 🗄️ Database Setup

- [ ] Production PostgreSQL database created
- [ ] Database connection string configured
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Prisma Client generated: `npx prisma generate`
- [ ] Database connection tested: `npm run db:check`
- [ ] Admin user created (via script or Prisma Studio)
- [ ] Database backup strategy configured

---

## 💳 Stripe Configuration

- [ ] Stripe account upgraded to live mode
- [ ] Live API keys obtained from Stripe Dashboard
- [ ] Webhook endpoint configured: `https://yourdomain.com/api/payments/webhook`
- [ ] Webhook events selected:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `checkout.session.completed`
- [ ] Webhook signing secret added to environment variables
- [ ] Test payment processed successfully

---

## 🏗️ Build & Deploy

### Build Process
- [ ] Dependencies installed: `npm ci`
- [ ] Application built: `npm run build`
- [ ] Build completed without errors
- [ ] TypeScript compilation successful
- [ ] No linting errors: `npm run lint`

### Deployment
- [ ] Application deployed to hosting platform
- [ ] Environment variables configured in hosting platform
- [ ] Server started: `npm run start:prod` or using PM2/Docker
- [ ] Application accessible at production URL

---

## 🌐 Infrastructure

### Domain & SSL
- [ ] Domain name configured
- [ ] DNS records pointing to server
- [ ] SSL certificate installed (HTTPS enabled)
- [ ] HTTP to HTTPS redirect configured
- [ ] `NEXTAUTH_URL` matches actual domain exactly

### Server Configuration
- [ ] Reverse proxy configured (Nginx/Apache) if needed
- [ ] Port configuration correct (default: 3000)
- [ ] Firewall rules configured
- [ ] Server resources adequate (CPU, RAM, storage)

---

## 🔒 Security

- [ ] HTTPS enabled and working
- [ ] Security headers configured (via next.config.js)
- [ ] Strong `NEXTAUTH_SECRET` used
- [ ] Database credentials secure
- [ ] Stripe keys are production keys (not test keys)
- [ ] No sensitive data in source code
- [ ] Error messages don't expose sensitive information
- [ ] CORS configured if needed

---

## ✅ Post-Deployment Testing

### Functional Testing
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] User registration works
- [ ] User login works
- [ ] Products display correctly
- [ ] Shopping cart functions
- [ ] Checkout process works
- [ ] Payment processing works (test with Stripe test card)
- [ ] Order confirmation emails sent
- [ ] Admin panel accessible: `/admin`
- [ ] Admin functions work (product management, orders, etc.)

### API Testing
- [ ] API routes respond correctly
- [ ] Authentication required routes protected
- [ ] Stripe webhooks receiving events
- [ ] Database queries working
- [ ] Image optimization working

### Performance
- [ ] Page load times acceptable
- [ ] Images loading and optimized
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified

---

## 📊 Monitoring & Maintenance

### Logging
- [ ] Application logs accessible
- [ ] Error logging configured (if using external service)
- [ ] Log rotation configured

### Monitoring
- [ ] Server uptime monitoring set up
- [ ] Database monitoring configured
- [ ] Application performance monitoring (optional)

### Backups
- [ ] Database backup strategy in place
- [ ] Backup restoration tested
- [ ] Backup schedule configured

---

## 📝 Documentation

- [ ] Deployment documentation reviewed
- [ ] Environment variables documented
- [ ] Team members have access to deployment guide
- [ ] Rollback procedure documented

---

## 🆘 Emergency Contacts

- [ ] Hosting provider support contact
- [ ] Database provider support contact
- [ ] Stripe support contact
- [ ] Team members on-call list

---

## 🎯 Final Steps

- [ ] All checklist items completed
- [ ] Production URL tested and working
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured
- [ ] Ready for production traffic!

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________

---

## 📚 Quick Reference

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Environment Variables**: See `ENV_VARIABLES.md`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Database Migrations**: `npx prisma migrate deploy`

---

**Last Updated**: 2025-01-15

