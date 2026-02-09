-- ========================================
-- ENSURE PROMO_USAGE_LOGS RLS POLICIES
-- ========================================
-- This migration ensures the promo_usage_logs table has correct RLS policies
-- Specifically the service_role policy which is CRITICAL for order creation

-- Enable RLS on promo_usage_logs (if not already enabled)
ALTER TABLE public.promo_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Service role can manage promo usage logs" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Admins can manage promo usage logs" ON public.promo_usage_logs;
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_usage_logs;

-- CRITICAL: Create service_role policy
-- This allows the service_role key (used by getAdminDbClient) to bypass RLS
-- Without this, INSERT operations will fail with permission denied errors
--
-- NOTE: This project uses CUSTOM JWT authentication, NOT Supabase Auth
-- All database operations go through getAdminDbClient() which uses service_role key
-- Therefore, we ONLY need the service_role policy
-- User-level access control is handled in application code (requireAuth, requireAdmin)
CREATE POLICY "Service role can manage promo usage logs"
ON public.promo_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- NO authenticated user policies needed
-- We don't use auth.uid() - we use custom JWT tokens
-- All operations are done via service_role key with application-level auth checks

