-- ========================================
-- FIX FOR COUPONS RLS POLICY ERROR
-- ========================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Go to: https://zagoyabmutueuzzndkmb.supabase.co/project/zagoyabmutueuzzndkmb/sql
-- Then click "Run" to execute
-- ========================================

-- Step 1: Drop the existing incomplete policy
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Step 2: Create new policy with both USING and WITH CHECK clauses
-- This allows admins to SELECT, INSERT, UPDATE, and DELETE coupons
CREATE POLICY "Admins can manage coupons" 
ON public.coupons
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Step 3: Enable RLS on promo_usage_logs (if not already enabled)
ALTER TABLE public.promo_usage_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy for promo_usage_logs
DROP POLICY IF EXISTS "Admins can manage promo usage logs" ON public.promo_usage_logs;
CREATE POLICY "Admins can manage promo usage logs" 
ON public.promo_usage_logs
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Step 5: Allow users to view their own promo usage
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_usage_logs;
CREATE POLICY "Users can view own promo usage" 
ON public.promo_usage_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ========================================
-- DONE! You should now be able to insert coupons
-- ========================================
