-- Fix RLS policies for categories table

-- Enable RLS (idempotent)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access (everyone needs to see categories)
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories
    FOR SELECT
    USING (true);

-- 2. Allow admins/ops to insert, update, delete
DROP POLICY IF EXISTS "Enable write access for admins" ON categories;
CREATE POLICY "Enable write access for admins" ON categories
    FOR ALL
    USING (
        public.is_admin(auth.uid())
    );

