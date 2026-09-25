-- Normalize older 4-digit shipping zone ranges to full 7-digit PT postal format.
-- Example: 2685 becomes 2685000.
UPDATE "ShippingZone"
SET
  "postalCodeStart" = "postalCodeStart" * 1000,
  "postalCodeEnd" = ("postalCodeEnd" * 1000) + 999
WHERE "postalCodeStart" BETWEEN 1000 AND 9999
  AND "postalCodeEnd" BETWEEN 1000 AND 9999;
