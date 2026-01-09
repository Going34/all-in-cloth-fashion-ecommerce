-- Create settings table for storing application configuration
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value) VALUES
  ('general', '{"storeName": "All in cloth", "supportEmail": "support@allincloth.com", "storeDescription": "Redefining modern luxury through architectural silhouettes and ethical craftsmanship."}'::jsonb),
  ('shipping', '{"standardRate": 15.0, "expressRate": 25.0, "freeShippingThreshold": 100.0}'::jsonb),
  ('tax', '{"rate": 8.0, "type": "vat"}'::jsonb),
  ('paymentMethods', '{"stripe": {"enabled": true}, "paypal": {"enabled": true}, "applePay": {"enabled": true}, "googlePay": {"enabled": true}}'::jsonb)
ON CONFLICT (key) DO NOTHING;

