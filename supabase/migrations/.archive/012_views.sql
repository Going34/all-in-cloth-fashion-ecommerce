-- =====================================================
-- Database Views
-- =====================================================

-- View: Product with calculated rating
CREATE OR REPLACE VIEW products_with_ratings AS
SELECT 
    p.*,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id;

-- View: Inventory status
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
    i.*,
    pv.product_id,
    pv.sku,
    pv.color,
    pv.size,
    pr.name as product_name,
    (i.stock - i.reserved_stock) as available_stock,
    CASE 
        WHEN i.stock = 0 THEN 'out_of_stock'
        WHEN (i.stock - i.reserved_stock) <= i.low_stock_threshold THEN 'low_stock'
        ELSE 'in_stock'
    END as status
FROM inventory i
JOIN product_variants pv ON pv.id = i.variant_id
JOIN products pr ON pr.id = pv.product_id;


