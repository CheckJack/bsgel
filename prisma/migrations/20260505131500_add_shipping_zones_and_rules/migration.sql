DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'shippingAmount'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "shippingAmount" DECIMAL(10,2);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ShippingZone" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "postalCodeStart" INTEGER NOT NULL,
  "postalCodeEnd" INTEGER NOT NULL,
  "shippingCost" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ShippingRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "freeShippingThreshold" DECIMAL(10,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShippingZone_isActive_idx" ON "ShippingZone"("isActive");
CREATE INDEX IF NOT EXISTS "ShippingZone_postalCodeStart_postalCodeEnd_idx" ON "ShippingZone"("postalCodeStart", "postalCodeEnd");
CREATE INDEX IF NOT EXISTS "ShippingRule_isActive_idx" ON "ShippingRule"("isActive");
