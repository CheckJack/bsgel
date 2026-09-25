-- SEO: public URL slugs for products (id remains the system key)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Temporary unique-ish fill: name-based slug + id suffix guarantees uniqueness
UPDATE "Product"
SET "slug" = lower("id")
WHERE "slug" IS NULL OR btrim("slug") = '';

-- Prefer readable name-based slugs; keep id suffix only when needed (applied in app backfill).
-- This SQL seed ensures NOT NULL migration never fails on empty rows.
UPDATE "Product" p
SET "slug" = trim(both '-' FROM lower(regexp_replace(
  regexp_replace(
    translate(
      coalesce(nullif(btrim(p."name"), ''), p."id"),
      'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy'
    ),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  ),
  '-+',
  '-',
  'g'
))) || '-' || lower(p."id")
WHERE p."slug" = lower(p."id") OR p."slug" IS NULL OR btrim(p."slug") = '';

-- Collapse any remaining empties
UPDATE "Product" SET "slug" = lower("id") WHERE "slug" IS NULL OR btrim("slug") = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_slug_key'
  ) THEN
    ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
    ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");
