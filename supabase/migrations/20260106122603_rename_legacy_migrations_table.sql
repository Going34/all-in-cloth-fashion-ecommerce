-- =====================================================
-- Rename Legacy Migration Tracking Table
-- =====================================================
-- 
-- This migration renames the old custom migration tracking table
-- to schema_migrations_legacy. This table is no longer used as we
-- have switched to Supabase CLI's built-in migration system.
-- 
-- The legacy table is preserved for historical reference only.
-- Supabase CLI uses supabase_migrations.schema_migrations for tracking.
-- 
-- =====================================================

ALTER TABLE IF EXISTS "public"."schema_migrations" 
RENAME TO "schema_migrations_legacy";

COMMENT ON TABLE "public"."schema_migrations_legacy" IS 
'Legacy migration tracking table (no longer used). Supabase CLI now manages migrations via supabase_migrations.schema_migrations.';

