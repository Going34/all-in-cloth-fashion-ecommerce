-- Add partial COD columns to orders table

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'PREPAID',
ADD COLUMN IF NOT EXISTS advance_payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_partial_payment boolean DEFAULT false;

-- Add check constraint for payment_mode
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_mode_check') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check CHECK (payment_mode IN ('PREPAID', 'COD', 'PARTIAL_COD'));
    END IF;
END $$;
