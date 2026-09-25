DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ShippingZone' AND column_name = 'freeShippingThreshold'
  ) THEN
    ALTER TABLE "ShippingZone" ADD COLUMN "freeShippingThreshold" DECIMAL(10,2);
  END IF;
END $$;
