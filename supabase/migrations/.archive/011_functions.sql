-- =====================================================
-- Database Functions
-- =====================================================

-- FUNCTION: Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id AND r.name IN ('ADMIN', 'OPS')
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- FUNCTION: Reserve inventory (for checkout)
CREATE OR REPLACE FUNCTION reserve_inventory(p_variant_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock INT;
    v_reserved INT;
    v_available INT;
BEGIN
    -- Lock the row
    SELECT stock, reserved_stock INTO v_stock, v_reserved
    FROM inventory
    WHERE variant_id = p_variant_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    v_available := v_stock - v_reserved;
    
    IF v_available < p_quantity THEN
        RETURN FALSE;
    END IF;
    
    UPDATE inventory
    SET reserved_stock = reserved_stock + p_quantity
    WHERE variant_id = p_variant_id;
    
    RETURN TRUE;
END;
$$ language 'plpgsql';

-- FUNCTION: Release reserved inventory
CREATE OR REPLACE FUNCTION release_reserved_inventory(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory
    SET reserved_stock = GREATEST(0, reserved_stock - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$ language 'plpgsql';

-- FUNCTION: Commit reserved inventory (after payment)
CREATE OR REPLACE FUNCTION commit_inventory(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory
    SET 
        stock = stock - p_quantity,
        reserved_stock = GREATEST(0, reserved_stock - p_quantity)
    WHERE variant_id = p_variant_id;
END;
$$ language 'plpgsql';


