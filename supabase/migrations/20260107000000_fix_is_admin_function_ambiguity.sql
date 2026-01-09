-- =====================================================
-- Fix is_admin function to resolve user_id ambiguity
-- =====================================================
-- 
-- Root Cause: The is_admin function parameter 'user_id' conflicts with 
-- column names when RLS policies are evaluated during INSERT operations
-- with .select() queries that include multiple tables with user_id columns.
--
-- When PostgreSQL evaluates: WHERE ur.user_id = user_id
-- It can't determine if 'user_id' refers to:
--   1. The function parameter 'user_id'
--   2. A column 'user_id' from another table in the query context
--
-- Fix: Use a subquery/CTE to isolate the parameter reference, ensuring
-- PostgreSQL correctly identifies it as the function parameter.

CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Isolate the parameter to avoid ambiguity with column names
    v_user_id := "user_id";
    
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = v_user_id AND r.name IN ('ADMIN', 'OPS')
    );
END;
$$;

