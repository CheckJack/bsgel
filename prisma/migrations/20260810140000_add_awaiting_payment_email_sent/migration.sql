-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "awaitingPaymentEmailSentAt" TIMESTAMP(3);
