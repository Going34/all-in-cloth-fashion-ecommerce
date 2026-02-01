-- Add phone column to addresses table
-- Phone number is mandatory for all addresses

ALTER TABLE "public"."addresses" 
ADD COLUMN IF NOT EXISTS "phone" character varying(20) NOT NULL DEFAULT '';

-- Remove default after adding column to ensure it's truly mandatory for new records
-- Note: This sets a default for existing records, but new records must provide phone
ALTER TABLE "public"."addresses" 
ALTER COLUMN "phone" DROP DEFAULT;





