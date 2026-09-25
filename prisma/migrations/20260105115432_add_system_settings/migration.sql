-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlogStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "BlogStatus" ADD VALUE 'APPROVED';
ALTER TYPE "BlogStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "assignedReviewerId" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "reviewComments" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "coverPictureUrl" TEXT,
ADD COLUMN     "optimizeHeight" INTEGER,
ADD COLUMN     "optimizeWidth" INTEGER;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "Blog_assignedReviewerId_idx" ON "Blog"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "Blog_createdBy_idx" ON "Blog"("createdBy");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_categoryId_featured_idx" ON "Product"("categoryId", "featured");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_idx" ON "ProductReview"("productId", "status");
