-- =====================================================
-- Coupons
-- =====================================================

-- TABLE: coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type coupon_type NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

-- TABLE: order_coupons
CREATE TABLE IF NOT EXISTS order_coupons (
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    PRIMARY KEY (order_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_order_coupons_order_id ON order_coupons(order_id);
CREATE INDEX IF NOT EXISTS idx_order_coupons_coupon_id ON order_coupons(coupon_id);


