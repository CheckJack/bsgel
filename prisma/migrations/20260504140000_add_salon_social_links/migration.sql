-- Optional social URLs on Salon (additive; safe if columns already exist, e.g. after a prior db push).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Salon' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE "Salon" ADD COLUMN "instagram" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Salon' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE "Salon" ADD COLUMN "facebook" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Salon' AND column_name = 'pinterest'
  ) THEN
    ALTER TABLE "Salon" ADD COLUMN "pinterest" TEXT;
  END IF;
END $$;
