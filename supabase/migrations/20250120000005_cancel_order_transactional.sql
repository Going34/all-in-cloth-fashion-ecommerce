-- Cancel a pending order and release reserved inventory atomically.
-- This is used for user-initiated cancellations and for expiry jobs.

DROP FUNCTION IF EXISTS public.cancel_order_transactional(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.cancel_order_transactional(UUID, UUID);

CREATE OR REPLACE FUNCTION public.cancel_order_transactional(
  p_order_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_status public.order_status;
  v_item RECORD;
BEGIN
  -- Lock order row
  SELECT status INTO v_status
  FROM public.orders
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Idempotent: already cancelled
  IF v_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'cancelled', true, 'duplicate', true);
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be cancelled (current status: %)', v_status;
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history(order_id, status)
  VALUES (p_order_id, 'cancelled');

  -- Release reserved inventory
  FOR v_item IN
    SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      PERFORM public.release_reserved_inventory(v_item.variant_id, v_item.quantity);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'cancelled', true, 'duplicate', false, 'reason', p_reason);
END;
$$;


