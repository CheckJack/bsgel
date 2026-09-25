-- Add isSystem flag for certifications that define access rules but are never assigned
ALTER TABLE "Certification" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Certification_isSystem_idx" ON "Certification"("isSystem");

-- Seed Final Client system certification (idempotent)
INSERT INTO "Certification" ("id", "name", "description", "isActive", "isSystem", "createdAt", "updatedAt")
SELECT
  'final_client_system',
  'Final Client',
  'Default product categories available to non-professional customers (no certification). This entry is never assigned to users — edit categories here to control retail access.',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Certification" WHERE "name" = 'Final Client' OR "isSystem" = true
);

-- Link current retail category slugs (Spa, Ethos, Gemini aliases) if they exist
INSERT INTO "CertificationCategory" ("id", "certificationId", "categoryId", "createdAt")
SELECT
  'fcc_' || c."id" || '_' || cat."id",
  c."id",
  cat."id",
  CURRENT_TIMESTAMP
FROM "Certification" c
CROSS JOIN "Category" cat
WHERE c."isSystem" = true
  AND LOWER(TRIM(cat."slug")) IN (
    'spa',
    'ethos',
    'cuidados-das-unhas',
    'verniz-clssico',
    'verniz-classico',
    'gemini'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "CertificationCategory" cc
    WHERE cc."certificationId" = c."id"
      AND cc."categoryId" = cat."id"
  );
