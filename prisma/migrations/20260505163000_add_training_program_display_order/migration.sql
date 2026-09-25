ALTER TABLE "TrainingProgram"
ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "TrainingProgram_displayOrder_idx"
ON "TrainingProgram" ("displayOrder");

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) AS rn
  FROM "TrainingProgram"
)
UPDATE "TrainingProgram" tp
SET "displayOrder" = ordered.rn
FROM ordered
WHERE tp."id" = ordered."id"
  AND (tp."displayOrder" IS NULL OR tp."displayOrder" = 0);
