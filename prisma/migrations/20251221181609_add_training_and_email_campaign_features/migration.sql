-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SCHEDULED', 'SENT');

-- CreateEnum
CREATE TYPE "TrainingBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TrainingFormat" AS ENUM ('ONLINE', 'PRESENTIAL', 'HYBRID');

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewComments" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "assignedReviewerId" TEXT,
    "recipientList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipientType" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "days" JSONB,
    "totalHours" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgramProduct" (
    "id" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingProgramProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "format" "TrainingFormat" NOT NULL DEFAULT 'PRESENTIAL',
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "TrainingBookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailCampaign_scheduledDate_idx" ON "EmailCampaign"("scheduledDate");

-- CreateIndex
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_assignedReviewerId_idx" ON "EmailCampaign"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "EmailCampaign_createdBy_idx" ON "EmailCampaign"("createdBy");

-- CreateIndex
CREATE INDEX "TrainingProgram_isActive_idx" ON "TrainingProgram"("isActive");

-- CreateIndex
CREATE INDEX "TrainingProgram_createdAt_idx" ON "TrainingProgram"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingProgramProduct_trainingProgramId_idx" ON "TrainingProgramProduct"("trainingProgramId");

-- CreateIndex
CREATE INDEX "TrainingProgramProduct_productId_idx" ON "TrainingProgramProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingProgramProduct_trainingProgramId_productId_key" ON "TrainingProgramProduct"("trainingProgramId", "productId");

-- CreateIndex
CREATE INDEX "TrainingSession_programId_idx" ON "TrainingSession"("programId");

-- CreateIndex
CREATE INDEX "TrainingSession_startDate_idx" ON "TrainingSession"("startDate");

-- CreateIndex
CREATE INDEX "TrainingSession_isActive_idx" ON "TrainingSession"("isActive");

-- CreateIndex
CREATE INDEX "TrainingSession_startDate_isActive_idx" ON "TrainingSession"("startDate", "isActive");

-- CreateIndex
CREATE INDEX "TrainingSession_format_idx" ON "TrainingSession"("format");

-- CreateIndex
CREATE INDEX "TrainingBooking_userId_idx" ON "TrainingBooking"("userId");

-- CreateIndex
CREATE INDEX "TrainingBooking_programId_idx" ON "TrainingBooking"("programId");

-- CreateIndex
CREATE INDEX "TrainingBooking_sessionId_idx" ON "TrainingBooking"("sessionId");

-- CreateIndex
CREATE INDEX "TrainingBooking_status_idx" ON "TrainingBooking"("status");

-- CreateIndex
CREATE INDEX "TrainingBooking_createdAt_idx" ON "TrainingBooking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBooking_userId_sessionId_key" ON "TrainingBooking"("userId", "sessionId");

-- AddForeignKey
ALTER TABLE "TrainingProgramProduct" ADD CONSTRAINT "TrainingProgramProduct_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgramProduct" ADD CONSTRAINT "TrainingProgramProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingBooking" ADD CONSTRAINT "TrainingBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
