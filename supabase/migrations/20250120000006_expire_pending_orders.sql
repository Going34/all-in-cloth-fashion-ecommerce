-- Expire pending orders older than N minutes by cancelling them and releasing reserved inventory.
-- Concurrency-safe via FOR UPDATE SKIP LOCKED.

DROP FUNCTION IF EXISTS public.expire_pending_orders(INT);
DROP FUNCTION IF EXISTS public.expire_pending_orders();

CREATE OR REPLACE FUNCTION public.expire_pending_orders(p_cutoff_minutes INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_count INT := 0;
BEGIN
  FOR v_order IN
    SELECT id
    FROM public.orders
    WHERE status = 'pending'
      AND created_at < (NOW() - make_interval(mins => p_cutoff_minutes))
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Re-check status is pending and lock row
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_order.id
      AND status = 'pending';

    IF FOUND THEN
      INSERT INTO public.order_status_history(order_id, status)
      VALUES (v_order.id, 'cancelled');

      FOR v_item IN
        SELECT variant_id, quantity FROM public.order_items WHERE order_id = v_order.id
      LOOP
        IF v_item.variant_id IS NOT NULL THEN
          PERFORM public.release_reserved_inventory(v_item.variant_id, v_item.quantity);
        END IF;
      END LOOP;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'expired', v_count, 'cutoff_minutes', p_cutoff_minutes);
END;
$$;


