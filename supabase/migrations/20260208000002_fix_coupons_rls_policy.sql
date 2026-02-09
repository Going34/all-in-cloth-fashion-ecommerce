-- Fix RLS policies for coupons and promo_usage_logs tables
-- Issue: This project uses CUSTOM JWT authentication, NOT Supabase Auth
-- All database operations go through getAdminDbClient() which uses service_role key
-- Therefore, we ONLY need service_role policies (auth.uid() doesn't work here)

-- Drop existing policy for coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Create service_role policy for coupons
-- All coupon operations are done via service_role with application-level auth checks
CREATE POLICY "Service role can manage coupons"
ON public.coupons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on promo_usage_logs if not already enabled
ALTER TABLE public.promo_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for promo_usage_logs
DROP POLICY IF EXISTS "Admins can manage promo usage logs" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Service role can manage promo usage logs" ON public.promo_usage_logs;

-- CRITICAL: Create service_role policy (this allows service_role key to bypass RLS)
-- This is the ONLY policy needed since we use custom JWT auth with service_role key
CREATE POLICY "Service role can manage promo usage logs"
ON public.promo_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
