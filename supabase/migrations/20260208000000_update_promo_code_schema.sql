-- Up Migration

-- Rename expires_at to valid_till for consistency
ALTER TABLE coupons RENAME COLUMN expires_at TO valid_till;

-- Add new columns to coupons
ALTER TABLE coupons 
ADD COLUMN min_order_amount NUMERIC DEFAULT 0,
ADD COLUMN max_discount NUMERIC,
ADD COLUMN usage_limit INTEGER,
ADD COLUMN used_count INTEGER DEFAULT 0,
ADD COLUMN valid_from TIMESTAMPTZ,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create promo_usage_logs
CREATE TABLE IF NOT EXISTS promo_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  promo_code TEXT NOT NULL,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_order_id ON promo_usage_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_user_id ON promo_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_logs_promo_code ON promo_usage_logs(promo_code);
