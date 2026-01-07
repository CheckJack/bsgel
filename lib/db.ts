import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force a fresh Prisma Client instance to pick up schema changes
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  // Clear the cached instance in development to pick up schema changes
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Verify coupon model is available (for debugging)
if (process.env.NODE_ENV === 'development' && typeof db.coupon === 'undefined') {
  console.warn('⚠️  Warning: Coupon model not found in Prisma client. Please restart the dev server.')
}

