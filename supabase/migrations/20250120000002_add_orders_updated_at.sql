-- Add updated_at to orders (required by payment/order status transaction functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

    -- Backfill existing rows
    UPDATE public.orders
      SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);
  END IF;
END $$;

-- Keep updated_at fresh on updates (function exists in baseline migration)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


