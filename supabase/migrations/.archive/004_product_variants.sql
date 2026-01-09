-- =====================================================
-- Product Variants and Inventory
-- =====================================================

-- TABLE: product_variants (CORE TABLE)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(100) NOT NULL,
    size VARCHAR(20) NOT NULL,
    price_override DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(product_id, color, size)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

-- TABLE: variant_images
CREATE TABLE IF NOT EXISTS variant_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_display_order ON variant_images(display_order);

-- TABLE: inventory
CREATE TABLE IF NOT EXISTS inventory (
    variant_id UUID PRIMARY KEY REFERENCES product_variants(id) ON DELETE CASCADE,
    stock INT DEFAULT 0 NOT NULL,
    reserved_stock INT DEFAULT 0 NOT NULL,
    low_stock_threshold INT DEFAULT 5 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


