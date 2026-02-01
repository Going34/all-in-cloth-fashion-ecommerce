-- Migration: Product System Critical Fixes & Improvements + UUIDv7 Support

-- 0. UUIDv7 Generation Function
-- Source: https://gist.github.com/kjmph/5bd772b2c2df145aa645b837da7eca74
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);

  -- use random v4 uuid as starting point (which has the same variant we need)
  uuid_bytes = uuid_send(gen_random_uuid());

  -- overlay timestamp
  uuid_bytes = overlay(uuid_bytes placing unix_ts_ms from 1 for 6);

  -- set version 7 (0111)
  uuid_bytes = set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & x'0f'::int) | x'70'::int);

  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$
LANGUAGE plpgsql
VOLATILE;

-- 1. Add Soft Delete Support
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- 2. Add Missing Critical Indexes for Performance
-- Admin list filtering often uses status + featured + created_at
CREATE INDEX IF NOT EXISTS idx_products_status_featured_created ON products(status, featured, created_at DESC);

-- Active variant queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON product_variants(product_id, is_active) WHERE is_active = true;

-- Stock checks (only care about items in stock)
CREATE INDEX IF NOT EXISTS idx_inventory_stock_check ON inventory(variant_id, stock) WHERE stock > 0;

-- 3. Future Proofing Columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ NULL;

-- 4. Variant Attributes (for extensibility beyond color/size)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- 5. Add Audit Logs Support (if not fully set up)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    actor_id UUID,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_entity_id ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 6. Add SKU Prefix/Config
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku_prefix VARCHAR(50);

-- 6b. Add Idempotency Key
ALTER TABLE products ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_products_idempotency_key ON products(idempotency_key);

-- 7. Add Unique Constraint for Product Variants (Color/Size)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_color_size_key'
    ) THEN
        ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_id_color_size_key UNIQUE (product_id, color, size);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- 8. Switch all UUID tables to use UUIDv7 for NEW records
-- This does not change existing IDs, but ensures locality for new inserts
ALTER TABLE products ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE product_variants ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE categories ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE orders ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE order_items ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payments ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE payment_transactions ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE reviews ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE addresses ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE roles ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE coupons ALTER COLUMN id SET DEFAULT uuid_generate_v7();
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v7(); -- If possible
