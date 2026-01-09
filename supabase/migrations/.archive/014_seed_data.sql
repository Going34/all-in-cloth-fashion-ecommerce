-- =====================================================
-- Seed Data
-- =====================================================

-- NOTE: Default admin user should be created using the script:
--   npm run create:admin
-- Or manually via Supabase Dashboard → Authentication → Users → Add User
-- Then assign ADMIN role via user_roles table

-- Sample categories
INSERT INTO categories (id, name, parent_id) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Menswear', NULL),
    ('a0000000-0000-0000-0000-000000000002', 'Womenswear', NULL),
    ('a0000000-0000-0000-0000-000000000003', 'Shirts', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000004', 'Pants', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000005', 'Dresses', 'a0000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000006', 'Tops', 'a0000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000007', 'Accessories', NULL),
    ('a0000000-0000-0000-0000-000000000008', 'Footwear', NULL)
ON CONFLICT (id) DO NOTHING;


