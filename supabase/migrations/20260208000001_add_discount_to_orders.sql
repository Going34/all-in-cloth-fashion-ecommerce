-- Add discount column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Update existing orders to have 0 discount if null (though default handles it for new ones)
UPDATE orders SET discount = 0 WHERE discount IS NULL;
