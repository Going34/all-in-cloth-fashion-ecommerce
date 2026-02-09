-- ========================================
-- PROMO USAGE LOGS TABLE SETUP
-- ========================================
-- Execute this in Supabase SQL Editor if the table doesn't exist
-- Go to: https://zagoyabmutueuzzndkmb.supabase.co/project/zagoyabmutueuzzndkmb/sql
-- ========================================

-- Step 1: Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'promo_usage_logs'
);

-- Step 2: Create table if it doesn't exist (from migration 20260208000000)
CREATE TABLE IF NOT EXISTS promo_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  promo_code TEXT NOT NULL,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_order_id ON promo_usage_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_user_id ON promo_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_promo_code ON promo_usage_logs(promo_code);

-- Step 4: Enable RLS (if not already enabled)
ALTER TABLE promo_usage_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage promo usage logs" ON promo_usage_logs;
DROP POLICY IF EXISTS "Users can view own promo usage" ON promo_usage_logs;
DROP POLICY IF EXISTS "Service role can manage promo usage logs" ON promo_usage_logs;

-- Step 6: Create RLS policy for service_role (CRITICAL!)
-- This allows the service_role key to bypass RLS
CREATE POLICY "Service role can manage promo usage logs"
ON promo_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 7: Create policy for authenticated users to view their own usage
CREATE POLICY "Users can view own promo usage" 
ON promo_usage_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ========================================
-- VERIFICATION
-- ========================================
-- Check table structure
\d promo_usage_logs

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'promo_usage_logs';

-- ========================================
-- DONE!
-- ========================================
