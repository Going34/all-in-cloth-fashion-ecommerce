-- Fix: Commit inventory when payment is completed
-- Previously, stock was reserved but never deducted from the main count upon payment success.

-- Function: Update payment status and order status atomically
CREATE OR REPLACE FUNCTION update_payment_and_order_status(
    p_payment_id UUID,
    p_payment_status TEXT,
    p_order_status TEXT,
    p_gateway_txn_id VARCHAR(255) DEFAULT NULL,
    p_raw_response TEXT DEFAULT NULL,
    p_razorpay_order_id VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_current_payment_status VARCHAR(50);
    v_current_order_status VARCHAR(50);
    v_result JSONB;
    v_item RECORD;
BEGIN
    -- Get current payment status and order_id
    SELECT status, order_id INTO v_current_payment_status, v_order_id
    FROM payments
    WHERE id = p_payment_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found: %', p_payment_id;
    END IF;
    
    -- Get current order status
    SELECT status INTO v_current_order_status
    FROM orders
    WHERE id = v_order_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', v_order_id;
    END IF;
    
    -- Update payment status
    UPDATE payments
    SET status = p_payment_status::payment_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    -- Update or create payment transaction
    IF p_gateway_txn_id IS NOT NULL OR p_raw_response IS NOT NULL THEN
        -- Check if transaction exists
        PERFORM id FROM payment_transactions
        WHERE payment_id = p_payment_id
          AND gateway = 'razorpay'
          AND (
              (p_razorpay_order_id IS NOT NULL AND gateway_txn_id = p_razorpay_order_id)
              OR (p_razorpay_order_id IS NULL)
          )
        LIMIT 1;
        
        IF FOUND THEN
            UPDATE payment_transactions
            SET gateway_txn_id = COALESCE(p_gateway_txn_id, gateway_txn_id),
                raw_response = COALESCE(p_raw_response::jsonb, raw_response),
                status = (
                  CASE 
                      WHEN p_payment_status = 'completed' THEN 'success'
                      WHEN p_payment_status = 'failed' THEN 'failed'
                      ELSE 'pending'
                  END
                )::transaction_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE payment_id = p_payment_id
              AND gateway = 'razorpay'
              AND (
                  (p_razorpay_order_id IS NOT NULL AND gateway_txn_id = p_razorpay_order_id)
                  OR (p_razorpay_order_id IS NULL)
              );
        ELSE
            INSERT INTO payment_transactions (
                payment_id,
                gateway,
                gateway_txn_id,
                raw_response,
                status
            ) VALUES (
                p_payment_id,
                'razorpay',
                COALESCE(p_gateway_txn_id, p_razorpay_order_id),
                p_raw_response::jsonb,
                (
                  CASE 
                      WHEN p_payment_status = 'completed' THEN 'success'
                      WHEN p_payment_status = 'failed' THEN 'failed'
                      ELSE 'pending'
                  END
                )::transaction_status
            );
        END IF;
    END IF;
    
    -- Update order status if payment is completed
    IF p_payment_status = 'completed' AND p_order_status IS NOT NULL THEN
        -- Validate status transition
        IF v_current_order_status = 'pending' AND p_order_status = 'paid' THEN
            UPDATE orders
            SET status = p_order_status::order_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_order_id;
            
            -- Add status history
            INSERT INTO order_status_history (order_id, status)
            VALUES (v_order_id, p_order_status::order_status);

            -- COMMIT INVENTORY
            FOR v_item IN
              SELECT variant_id, quantity FROM order_items WHERE order_id = v_order_id
            LOOP
              IF v_item.variant_id IS NOT NULL THEN
                PERFORM public.commit_inventory(v_item.variant_id, v_item.quantity);
              END IF;
            END LOOP;
        END IF;
    END IF;

    -- Cancel order + release reserved inventory if payment failed
    IF p_payment_status = 'failed' THEN
        -- Only cancel/release once: pending -> cancelled
        IF v_current_order_status = 'pending' THEN
            UPDATE orders
            SET status = 'cancelled'::order_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_order_id;

            INSERT INTO order_status_history (order_id, status)
            VALUES (v_order_id, 'cancelled'::order_status);

            FOR v_item IN
              SELECT variant_id, quantity FROM order_items WHERE order_id = v_order_id
            LOOP
              IF v_item.variant_id IS NOT NULL THEN
                PERFORM public.release_reserved_inventory(v_item.variant_id, v_item.quantity);
              END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'order_id', v_order_id,
        'payment_status', p_payment_status,
        'order_status', p_order_status
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update payment and order status: %', SQLERRM;
END;
$$;

-- Function: Verify payment and update status atomically (with idempotency)
CREATE OR REPLACE FUNCTION verify_payment_transactional(
    p_order_id UUID,
    p_razorpay_payment_id VARCHAR(255),
    p_razorpay_order_id VARCHAR(255),
    p_payment_status TEXT,
    p_raw_payment_response TEXT DEFAULT NULL,
    p_raw_order_response TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_payment_id UUID;
    v_current_status VARCHAR(50);
    v_result JSONB;
    v_current_order_status VARCHAR(50);
    v_item RECORD;
BEGIN
    -- Find payment by order_id
    SELECT id, status INTO v_payment_id, v_current_status
    FROM payments
    WHERE order_id = p_order_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found for order: %', p_order_id;
    END IF;
    
    -- Idempotency check: if already completed, return existing status
    IF v_current_status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'payment_id', v_payment_id,
            'order_id', p_order_id,
            'payment_status', 'completed',
            'order_status', (SELECT status FROM orders WHERE id = p_order_id),
            'duplicate', true
        );
    END IF;
    
    -- Update payment status
    UPDATE payments
    SET status = p_payment_status::payment_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_payment_id;
    
    -- Update or create payment transaction
    PERFORM id FROM payment_transactions
    WHERE payment_id = v_payment_id
      AND gateway = 'razorpay'
      AND gateway_txn_id = p_razorpay_order_id
    LIMIT 1;
    
    IF FOUND THEN
        UPDATE payment_transactions
        SET gateway_txn_id = p_razorpay_payment_id,
            raw_response = COALESCE(p_raw_payment_response::jsonb, raw_response),
            status = (
              CASE 
                  WHEN p_payment_status = 'completed' THEN 'success'
                  WHEN p_payment_status = 'failed' THEN 'failed'
                  ELSE 'pending'
              END
            )::transaction_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = v_payment_id
          AND gateway = 'razorpay'
          AND gateway_txn_id = p_razorpay_order_id;
    ELSE
        INSERT INTO payment_transactions (
            payment_id,
            gateway,
            gateway_txn_id,
            raw_response,
            status
        ) VALUES (
            v_payment_id,
            'razorpay',
            p_razorpay_payment_id,
            p_raw_payment_response::jsonb,
            (
              CASE 
                  WHEN p_payment_status = 'completed' THEN 'success'
                  WHEN p_payment_status = 'failed' THEN 'failed'
                  ELSE 'pending'
              END
            )::transaction_status
        );
    END IF;
    
    -- Update order status if payment completed
    IF p_payment_status = 'completed' THEN
        SELECT status INTO v_current_order_status
        FROM orders
        WHERE id = p_order_id
        FOR UPDATE;

        IF v_current_order_status = 'pending' THEN
            UPDATE orders
            SET status = 'paid',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_order_id;
            
            -- Add status history
            INSERT INTO order_status_history (order_id, status)
            VALUES (p_order_id, 'paid')
            ON CONFLICT DO NOTHING;

            -- COMMIT INVENTORY
            FOR v_item IN
              SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id
            LOOP
              IF v_item.variant_id IS NOT NULL THEN
                PERFORM public.commit_inventory(v_item.variant_id, v_item.quantity);
              END IF;
            END LOOP;
        END IF;
    END IF;

    -- Cancel order + release reserved inventory if payment failed
    IF p_payment_status = 'failed' THEN
        SELECT status INTO v_current_order_status
        FROM orders
        WHERE id = p_order_id
        FOR UPDATE;

        IF v_current_order_status = 'pending' THEN
            UPDATE orders
            SET status = 'cancelled'::order_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_order_id;

            INSERT INTO order_status_history (order_id, status)
            VALUES (p_order_id, 'cancelled'::order_status);

            FOR v_item IN
              SELECT variant_id, quantity FROM order_items WHERE order_id = p_order_id
            LOOP
              IF v_item.variant_id IS NOT NULL THEN
                PERFORM public.release_reserved_inventory(v_item.variant_id, v_item.quantity);
              END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', p_payment_status = 'completed',
        'payment_id', v_payment_id,
        'order_id', p_order_id,
        'payment_status', p_payment_status,
        'order_status', CASE 
            WHEN p_payment_status = 'completed' THEN 'paid'
            WHEN p_payment_status = 'failed' THEN 'cancelled'
            ELSE (SELECT status FROM orders WHERE id = p_order_id)
        END,
        'duplicate', false
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to verify payment: %', SQLERRM;
END;
$$;

