-- =====================================================
-- All Migrations Combined
-- Generated: Tue Jan  6 11:07:24 AM IST 2026
-- =====================================================

-- =====================================================
-- Migration: 000_create_migrations_table.sql
-- =====================================================

-- =====================================================
-- Migration Tracking Table
-- This table tracks which migrations have been executed
-- =====================================================

-- Create migration status enum
CREATE TYPE migration_status AS ENUM ('success', 'failed', 'partial');

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    executed_by VARCHAR(255),
    execution_time_ms INTEGER,
    status migration_status DEFAULT 'success',
    error_message TEXT,
    sql_content TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON schema_migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);

-- Add comment
COMMENT ON TABLE schema_migrations IS 'Tracks executed database migrations to prevent duplicate execution';




-- =====================================================
-- Migration: 001_enums_and_extensions.sql
-- =====================================================

-- =====================================================
-- ENUM TYPES and Extensions
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE role_type AS ENUM ('USER', 'ADMIN', 'OPS');
CREATE TYPE product_status AS ENUM ('draft', 'live');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE coupon_type AS ENUM ('flat', 'percent');




-- =====================================================
-- Migration: 002_user_management.sql
-- =====================================================

-- =====================================================
-- User Management Tables
-- =====================================================

-- TABLE: users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_active ON users(is_active);

-- TABLE: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name role_type UNIQUE NOT NULL
);

CREATE INDEX idx_roles_name ON roles(name);

-- Insert default roles
INSERT INTO roles (name) VALUES ('USER'), ('ADMIN'), ('OPS');

-- TABLE: user_roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- FUNCTION: Create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_id UUID;
    user_name VARCHAR(255);
BEGIN
    -- Extract name from raw_user_meta_data if available
    user_name := NEW.raw_user_meta_data->>'full_name';
    IF user_name IS NULL THEN
        user_name := NEW.raw_user_meta_data->>'name';
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (id, email, name, is_email_verified)
    VALUES (NEW.id, NEW.email, user_name, NEW.email_confirmed_at IS NOT NULL);
    
    -- Get USER role id
    SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
    
    -- Assign default USER role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, user_role_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();




-- =====================================================
-- Migration: 003_product_catalog.sql
-- =====================================================

-- =====================================================
-- Product Catalog Tables
-- =====================================================

-- TABLE: products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    status product_status DEFAULT 'live',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);

-- TABLE: categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_name ON categories(name);

-- TABLE: product_categories
CREATE TABLE product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);




-- =====================================================
-- Migration: 004_product_variants.sql
-- =====================================================

-- =====================================================
-- Product Variants and Inventory
-- =====================================================

-- TABLE: product_variants (CORE TABLE)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price_override DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, color, size)
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_is_active ON product_variants(is_active);

-- TABLE: variant_images
CREATE TABLE variant_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0
);

CREATE INDEX idx_variant_images_variant_id ON variant_images(variant_id);
CREATE INDEX idx_variant_images_display_order ON variant_images(display_order);

-- TABLE: inventory
CREATE TABLE inventory (
    variant_id UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
    stock INT DEFAULT 0 NOT NULL,
    reserved_stock INT DEFAULT 0 NOT NULL,
    low_stock_threshold INT DEFAULT 5 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);




-- =====================================================
-- Migration: 005_shopping_features.sql
-- =====================================================

-- =====================================================
-- Shopping Features
-- =====================================================

-- TABLE: cart_items
CREATE TABLE cart_items (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (user_id, variant_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- TABLE: wishlist
CREATE TABLE wishlist (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);




-- =====================================================
-- Migration: 006_orders.sql
-- =====================================================

-- =====================================================
-- Orders and Order Management
-- =====================================================

-- TABLE: orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0.00,
    shipping DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id_created_at ON orders(user_id, created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);

-- TABLE: order_status_history
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at);

-- TABLE: order_items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    price_snapshot DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- SEQUENCE: Order number generation
CREATE SEQUENCE order_number_seq START 1;

-- FUNCTION: Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
                       LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();




-- =====================================================
-- Migration: 007_payments.sql
-- =====================================================

-- =====================================================
-- Payment Tables
-- =====================================================

-- TABLE: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- TABLE: payment_transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL,
    gateway_txn_id VARCHAR(255),
    raw_response JSONB,
    status transaction_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_gateway_txn_id ON payment_transactions(gateway_txn_id);




-- =====================================================
-- Migration: 008_user_data.sql
-- =====================================================

-- =====================================================
-- User Data Tables
-- =====================================================

-- TABLE: addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- TABLE: reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);




-- =====================================================
-- Migration: 009_coupons.sql
-- =====================================================

-- =====================================================
-- Coupons
-- =====================================================

-- TABLE: coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type coupon_type NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- TABLE: order_coupons
CREATE TABLE order_coupons (
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    PRIMARY KEY (order_id, coupon_id)
);

CREATE INDEX idx_order_coupons_order_id ON order_coupons(order_id);
CREATE INDEX idx_order_coupons_coupon_id ON order_coupons(coupon_id);




-- =====================================================
-- Migration: 010_audit_logs.sql
-- =====================================================

-- =====================================================
-- Audit Logs
-- =====================================================

-- TABLE: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity_entity_id ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);




-- =====================================================
-- Migration: 011_functions.sql
-- =====================================================

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
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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




-- =====================================================
-- Migration: 012_views.sql
-- =====================================================

-- =====================================================
-- Database Views
-- =====================================================

-- View: Product with calculated rating
CREATE VIEW products_with_ratings AS
SELECT 
    p.*,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id;

-- View: Inventory status
CREATE VIEW inventory_status AS
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




-- =====================================================
-- Migration: 013_rls_policies.sql
-- =====================================================

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: users
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    USING (is_admin(auth.uid()));

-- RLS POLICIES: user_roles
CREATE POLICY "Users can view own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON user_roles FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: products
CREATE POLICY "Anyone can view live products"
    ON products FOR SELECT
    USING (status = 'live');

CREATE POLICY "Admins can view all products"
    ON products FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage products"
    ON products FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: categories
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON categories FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: product_categories
CREATE POLICY "Anyone can view product categories"
    ON product_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage product categories"
    ON product_categories FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: product_variants
CREATE POLICY "Anyone can view active variants"
    ON product_variants FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can view all variants"
    ON product_variants FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage variants"
    ON product_variants FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: variant_images
CREATE POLICY "Anyone can view variant images"
    ON variant_images FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage variant images"
    ON variant_images FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: inventory
CREATE POLICY "Anyone can view inventory"
    ON inventory FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage inventory"
    ON inventory FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: cart_items
CREATE POLICY "Users can view own cart"
    ON cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart"
    ON cart_items FOR ALL
    USING (auth.uid() = user_id);

-- RLS POLICIES: wishlist
CREATE POLICY "Users can view own wishlist"
    ON wishlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
    ON wishlist FOR ALL
    USING (auth.uid() = user_id);

-- RLS POLICIES: orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage orders"
    ON orders FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: order_status_history
CREATE POLICY "Users can view own order history"
    ON order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_status_history.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order status history"
    ON order_status_history FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: order_items
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order items"
    ON order_items FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: payments
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage payments"
    ON payments FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: payment_transactions
CREATE POLICY "Users can view own transactions"
    ON payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN orders o ON o.id = p.order_id
            WHERE p.id = payment_transactions.payment_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage payment transactions"
    ON payment_transactions FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: addresses
CREATE POLICY "Users can view own addresses"
    ON addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own addresses"
    ON addresses FOR ALL
    USING (auth.uid() = user_id);

-- RLS POLICIES: reviews
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
    ON reviews FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: coupons
CREATE POLICY "Anyone can view valid coupons"
    ON coupons FOR SELECT
    USING (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

CREATE POLICY "Admins can manage coupons"
    ON coupons FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: order_coupons
CREATE POLICY "Users can view own order coupons"
    ON order_coupons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_coupons.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order coupons"
    ON order_coupons FOR ALL
    USING (is_admin(auth.uid()));

-- RLS POLICIES: audit_logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);




-- =====================================================
-- Migration: 014_seed_data.sql
-- =====================================================

-- =====================================================
-- Seed Data
-- =====================================================

-- NOTE: Default admin user should be created using the script:
--   npm run create:admin
-- Or manually via Supabase Dashboard → Authentication → Users → Add User
-- Then assign ADMIN role via user_roles table

-- Sample categories
INSERT INTO categories (id, name, parent_id) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Menswear', NULL),
    ('a0000000-0000-0000-0000-000000000002', 'Womenswear', NULL),
    ('a0000000-0000-0000-0000-000000000003', 'Shirts', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000004', 'Pants', 'a0000000-0000-0000-0000-000000000001'),
    ('a0000000-0000-0000-0000-000000000005', 'Dresses', 'a0000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000006', 'Tops', 'a0000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000007', 'Accessories', NULL),
    ('a0000000-0000-0000-0000-000000000008', 'Footwear', NULL)
ON CONFLICT (id) DO NOTHING;




