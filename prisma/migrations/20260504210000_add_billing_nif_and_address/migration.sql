-- NIF + billing address on User (saved for repeat checkout) and Order (snapshot per purchase).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'billingNif'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "billingNif" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'billingAddress'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "billingAddress" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'billingNif'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "billingNif" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'billingAddress'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "billingAddress" TEXT;
  END IF;
END $$;
