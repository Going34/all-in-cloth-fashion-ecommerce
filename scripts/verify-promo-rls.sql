-- ========================================
-- VERIFY AND FIX PROMO_USAGE_LOGS RLS
-- ========================================
-- This script verifies and fixes RLS policies for promo_usage_logs table
-- Run this in Supabase SQL Editor if you're getting 500 errors on order creation

-- Step 1: Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'promo_usage_logs'
) AS table_exists;

-- Step 2: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'promo_usage_logs';

-- Step 3: Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'promo_usage_logs';

-- Step 4: Drop all existing policies
DROP POLICY IF EXISTS "Service role can manage promo usage logs" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Admins can manage promo usage logs" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_usage_logs;

-- Step 5: Enable RLS
ALTER TABLE public.promo_usage_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create service_role policy (CRITICAL - allows service_role key to bypass RLS)
-- This is the ONLY policy needed since we use custom JWT auth with service_role key
CREATE POLICY "Service role can manage promo usage logs"
ON public.promo_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 7: NO authenticated user policy needed
-- We use custom JWT tokens, not Supabase Auth (auth.uid() won't work)
-- All operations go through service_role key via getAdminDbClient()
-- If you need user-level access, implement it in application code with service_role

-- Step 8: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'promo_usage_logs'
ORDER BY policyname;

-- Step 9: Test insert (should work with service_role key)
-- This is just a comment - actual test would be done from application

-- Step 10: Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'promo_usage_logs'
ORDER BY ordinal_position;

