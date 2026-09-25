-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN IF NOT EXISTS "openBooking" BOOLEAN NOT NULL DEFAULT false;
