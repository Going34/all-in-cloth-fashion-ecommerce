-- Create OTP table for secure custom OTP system
-- Stores hashed OTPs with expiry and attempt tracking

CREATE TABLE IF NOT EXISTS "public"."otps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" VARCHAR(20) NOT NULL,
  "otp_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS "idx_otps_phone" ON "public"."otps" ("phone");

-- Index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS "idx_otps_expires_at" ON "public"."otps" ("expires_at");

-- Unique constraint: only one active (non-verified, non-expired) OTP per phone
-- This is enforced at application level, but index helps with queries
CREATE INDEX IF NOT EXISTS "idx_otps_phone_active" 
  ON "public"."otps" ("phone", "verified", "expires_at") 
  WHERE "verified" = FALSE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_otps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_otps_updated_at_trigger ON "public"."otps";
CREATE TRIGGER update_otps_updated_at_trigger
  BEFORE UPDATE ON "public"."otps"
  FOR EACH ROW
  EXECUTE FUNCTION update_otps_updated_at();

COMMENT ON TABLE "public"."otps" IS 'Stores hashed OTPs for phone verification with expiry and attempt tracking';
COMMENT ON COLUMN "public"."otps"."phone" IS 'Phone number in E.164 format without + (e.g., 9198xxxxxxx)';
COMMENT ON COLUMN "public"."otps"."otp_hash" IS 'Bcrypt hash of the 6-digit OTP';
COMMENT ON COLUMN "public"."otps"."expires_at" IS 'OTP expiry timestamp (5 minutes from creation)';
COMMENT ON COLUMN "public"."otps"."attempts" IS 'Number of verification attempts (max 5)';
COMMENT ON COLUMN "public"."otps"."verified" IS 'Whether OTP has been successfully verified';

