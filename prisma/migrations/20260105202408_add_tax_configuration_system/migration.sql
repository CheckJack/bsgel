-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "taxAmount" DECIMAL(10,2),
ADD COLUMN     "taxRate" DECIMAL(5,2),
ADD COLUMN     "taxRegion" TEXT;

-- CreateTable
CREATE TABLE "TaxRegion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "postalCodePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxRegion_isActive_idx" ON "TaxRegion"("isActive");

-- CreateIndex
CREATE INDEX "TaxRegion_validFrom_idx" ON "TaxRegion"("validFrom");

-- CreateIndex
CREATE INDEX "TaxRegion_validUntil_idx" ON "TaxRegion"("validUntil");
