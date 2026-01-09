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


