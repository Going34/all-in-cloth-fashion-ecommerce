-- Transactional Order Creation Function
-- This function ensures atomic order creation with inventory reservation

-- Drop all existing function signatures to avoid ambiguity
-- Note: the DB may have older overloads that use NUMERIC/TEXT/CHARACTER VARYING, so we drop a wide set.
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID, NUMERIC, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID, NUMERIC, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, JSONB, UUID, DECIMAL);
DROP FUNCTION IF EXISTS public.create_order_transactional(UUID, TEXT, UUID, DECIMAL);

-- Ensure required columns exist (idempotency + address linkage)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'address_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN address_id UUID;
        ALTER TABLE orders
          ADD CONSTRAINT orders_address_id_fkey
          FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT;
        CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION create_order_transactional(
    p_user_id UUID,
    p_order_items JSONB,
    p_address_id UUID,
    p_shipping_amount DECIMAL(10, 2) DEFAULT 0,
    p_order_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR(50);
    v_subtotal DECIMAL(10, 2) := 0;
    v_tax DECIMAL(10, 2) := 0;
    v_total DECIMAL(10, 2) := 0;
    v_item JSONB;
    v_variant_id UUID;
    v_quantity INT;
    v_price DECIMAL(10, 2);
    v_product_name VARCHAR(255);
    v_sku VARCHAR(100);
    v_existing_order_id UUID;
    v_address_exists BOOLEAN;
    v_inventory_reserved BOOLEAN;
BEGIN
    
    -- Check for existing order with same idempotency key
    IF p_order_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_order_id
        FROM orders
        WHERE user_id = p_user_id
          AND idempotency_key = p_order_idempotency_key
        LIMIT 1;
        
        IF v_existing_order_id IS NOT NULL THEN
            SELECT order_number INTO v_order_number
            FROM orders
            WHERE id = v_existing_order_id;
            
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order_id,
                'order_number', v_order_number,
                'duplicate', true
            );
        END IF;
    END IF;
    
    -- Validate address exists
    SELECT EXISTS(SELECT 1 FROM addresses WHERE id = p_address_id AND user_id = p_user_id)
    INTO v_address_exists;
    
    IF NOT v_address_exists THEN
        RAISE EXCEPTION 'Address not found or does not belong to user';
    END IF;
    
    -- Validate and process order items
    IF jsonb_typeof(p_order_items) != 'array' THEN
        RAISE EXCEPTION 'p_order_items must be a JSON array';
    END IF;
    
    -- Validate inventory and calculate totals
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;
        
        IF v_variant_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid order item: variant_id and quantity (positive) are required';
        END IF;
        
        -- Get variant details (no inventory join here; locking inventory is handled by reserve_inventory())
        SELECT 
            pv.id,
            pv.sku,
            COALESCE(pv.price_override, p.base_price, 0) as price,
            p.name as product_name
        INTO 
            v_variant_id,
            v_sku,
            v_price,
            v_product_name
        FROM product_variants pv
        INNER JOIN products p ON pv.product_id = p.id
        WHERE pv.id = v_variant_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant not found: %', v_variant_id;
        END IF;
        
        -- Reserve inventory here (atomic check+reserve inside same DB transaction)
        v_inventory_reserved := reserve_inventory(v_variant_id, v_quantity);
        IF NOT v_inventory_reserved THEN
            RAISE EXCEPTION 'Insufficient stock for variant % (requested: %)', v_sku, v_quantity;
        END IF;
        
        -- Calculate subtotal
        v_subtotal := v_subtotal + (v_price * v_quantity);
    END LOOP;
    
    -- Calculate tax and total
    v_tax := v_subtotal * 0.1;
    v_total := v_subtotal + v_tax + p_shipping_amount;
    
    -- Create order
    INSERT INTO orders (
        user_id,
        address_id,
        status,
        subtotal,
        tax,
        shipping,
        total,
        idempotency_key
    ) VALUES (
        p_user_id,
        p_address_id,
        'pending',
        v_subtotal,
        v_tax,
        p_shipping_amount,
        v_total,
        p_order_idempotency_key
    )
    RETURNING id, order_number INTO v_order_id, v_order_number;
    
    -- Create order items and reserve inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;
        
        -- Get variant details again for snapshot
        SELECT 
            COALESCE(pv.price_override, p.base_price, 0) as price,
            p.name as product_name,
            pv.sku
        INTO 
            v_price,
            v_product_name,
            v_sku
        FROM product_variants pv
        INNER JOIN products p ON pv.product_id = p.id
        WHERE pv.id = v_variant_id;
        
        -- Insert order item
        INSERT INTO order_items (
            order_id,
            variant_id,
            product_name_snapshot,
            sku_snapshot,
            price_snapshot,
            quantity
        ) VALUES (
            v_order_id,
            v_variant_id,
            v_product_name,
            v_sku,
            v_price,
            v_quantity
        );
    END LOOP;
    
    -- Create initial status history
    INSERT INTO order_status_history (order_id, status)
    VALUES (v_order_id, 'pending');
    
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'duplicate', false
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
END;
$$;

