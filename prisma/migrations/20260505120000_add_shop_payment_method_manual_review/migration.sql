-- Shop payment method + manual payment admin review (MBWay / bank transfer).
DO $$ BEGIN
  CREATE TYPE "ShopPaymentMethod" AS ENUM ('STRIPE_CARD', 'STRIPE_KLARNA', 'MBWAY', 'BANK_TRANSFER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ManualPaymentReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shopPaymentMethod'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "shopPaymentMethod" "ShopPaymentMethod";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'manualPaymentStatus'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "manualPaymentStatus" "ManualPaymentReviewStatus";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'appliedCouponCode'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "appliedCouponCode" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Order_shopPaymentMethod_idx" ON "Order"("shopPaymentMethod");
CREATE INDEX IF NOT EXISTS "Order_manualPaymentStatus_idx" ON "Order"("manualPaymentStatus");
