import { Product, Category, ProductVariant, VariantImage, Inventory } from './types';

const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Menswear', parent_id: null },
  { id: 'cat-2', name: 'Womenswear', parent_id: null },
  { id: 'cat-3', name: 'Accessories', parent_id: null },
  { id: 'cat-4', name: 'Outerwear', parent_id: null },
];

const getCategoryByName = (name: string): Category => {
  return CATEGORIES.find(c => c.name === name) || CATEGORIES[0];
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Midnight Silk Slip Dress',
    base_price: 189,
    description: 'A luxurious 100% silk slip dress in a deep midnight blue. Perfect for evening events or layering. Features adjustable straps and a graceful bias cut.',
    categories: [getCategoryByName('Womenswear')],
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800'
    ],
    variants: [
      {
        id: 'v1-1',
        product_id: '1',
        sku: 'MSSD-MID-XS',
        color: 'Midnight',
        size: 'XS',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-1', stock: 12, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v1-1', variant_id: 'v1-1', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v1-2',
        product_id: '1',
        sku: 'MSSD-MID-S',
        color: 'Midnight',
        size: 'S',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-2', stock: 18, reserved_stock: 2, low_stock_threshold: 5 }
      },
      {
        id: 'v1-3',
        product_id: '1',
        sku: 'MSSD-MID-M',
        color: 'Midnight',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-3', stock: 15, reserved_stock: 0, low_stock_threshold: 5 }
      },
      {
        id: 'v1-4',
        product_id: '1',
        sku: 'MSSD-MID-L',
        color: 'Midnight',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-4', stock: 8, reserved_stock: 1, low_stock_threshold: 5 }
      },
      {
        id: 'v1-5',
        product_id: '1',
        sku: 'MSSD-CHP-S',
        color: 'Champagne',
        size: 'S',
        price_override: 199,
        is_active: true,
        inventory: { variant_id: 'v1-5', stock: 10, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v1-5', variant_id: 'v1-5', image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v1-6',
        product_id: '1',
        sku: 'MSSD-CHP-M',
        color: 'Champagne',
        size: 'M',
        price_override: 199,
        is_active: true,
        inventory: { variant_id: 'v1-6', stock: 7, reserved_stock: 0, low_stock_threshold: 5 }
      },
      {
        id: 'v1-7',
        product_id: '1',
        sku: 'MSSD-ONX-M',
        color: 'Onyx',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-7', stock: 20, reserved_stock: 3, low_stock_threshold: 5 },
        images: [{ id: 'img-v1-7', variant_id: 'v1-7', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v1-8',
        product_id: '1',
        sku: 'MSSD-ONX-L',
        color: 'Onyx',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v1-8', stock: 4, reserved_stock: 0, low_stock_threshold: 5 }
      }
    ],
    rating: 4.8,
    reviews: 124,
    featured: true,
    status: 'Live'
  },
  {
    id: '2',
    name: 'Architectural Cashmere Sweater',
    base_price: 245,
    description: 'Ultra-soft Italian cashmere featuring clean lines and a modern silhouette. A foundational piece for the sophisticated wardrobe.',
    categories: [getCategoryByName('Menswear')],
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800',
      'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=800',
      'https://images.unsplash.com/photo-1611911813524-8e9f428355d2?q=80&w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800'
    ],
    variants: [
      {
        id: 'v2-1',
        product_id: '2',
        sku: 'ACS-OAT-S',
        color: 'Oatmeal',
        size: 'S',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v2-1', stock: 14, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v2-1', variant_id: 'v2-1', image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v2-2',
        product_id: '2',
        sku: 'ACS-OAT-M',
        color: 'Oatmeal',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v2-2', stock: 22, reserved_stock: 4, low_stock_threshold: 5 }
      },
      {
        id: 'v2-3',
        product_id: '2',
        sku: 'ACS-OAT-L',
        color: 'Oatmeal',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v2-3', stock: 16, reserved_stock: 0, low_stock_threshold: 5 }
      },
      {
        id: 'v2-4',
        product_id: '2',
        sku: 'ACS-SLT-M',
        color: 'Slate',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v2-4', stock: 9, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v2-4', variant_id: 'v2-4', image_url: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v2-5',
        product_id: '2',
        sku: 'ACS-SLT-L',
        color: 'Slate',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v2-5', stock: 11, reserved_stock: 2, low_stock_threshold: 5 }
      },
      {
        id: 'v2-6',
        product_id: '2',
        sku: 'ACS-CHR-XL',
        color: 'Charcoal',
        size: 'XL',
        price_override: 259,
        is_active: true,
        inventory: { variant_id: 'v2-6', stock: 6, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v2-6', variant_id: 'v2-6', image_url: 'https://images.unsplash.com/photo-1611911813524-8e9f428355d2?q=80&w=800', display_order: 1 }]
      }
    ],
    rating: 4.9,
    reviews: 86,
    featured: true,
    status: 'Live'
  },
  {
    id: '3',
    name: 'Vaulted Leather Chelsea Boots',
    base_price: 320,
    description: 'Hand-crafted full-grain leather boots with a durable Goodyear welt construction. Designed for longevity and refined style.',
    categories: [getCategoryByName('Accessories')],
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800'
    ],
    variants: [
      {
        id: 'v3-1',
        product_id: '3',
        sku: 'VLCB-COG-8',
        color: 'Cognac',
        size: '8',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-1', stock: 8, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v3-1', variant_id: 'v3-1', image_url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v3-2',
        product_id: '3',
        sku: 'VLCB-COG-9',
        color: 'Cognac',
        size: '9',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-2', stock: 12, reserved_stock: 1, low_stock_threshold: 3 }
      },
      {
        id: 'v3-3',
        product_id: '3',
        sku: 'VLCB-COG-10',
        color: 'Cognac',
        size: '10',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-3', stock: 15, reserved_stock: 0, low_stock_threshold: 3 }
      },
      {
        id: 'v3-4',
        product_id: '3',
        sku: 'VLCB-ESP-9',
        color: 'Espresso',
        size: '9',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-4', stock: 7, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v3-4', variant_id: 'v3-4', image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v3-5',
        product_id: '3',
        sku: 'VLCB-ESP-10',
        color: 'Espresso',
        size: '10',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-5', stock: 10, reserved_stock: 2, low_stock_threshold: 3 }
      },
      {
        id: 'v3-6',
        product_id: '3',
        sku: 'VLCB-BLK-11',
        color: 'Black',
        size: '11',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-6', stock: 5, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v3-6', variant_id: 'v3-6', image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v3-7',
        product_id: '3',
        sku: 'VLCB-BLK-12',
        color: 'Black',
        size: '12',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v3-7', stock: 3, reserved_stock: 0, low_stock_threshold: 3 }
      }
    ],
    rating: 4.7,
    reviews: 52,
    status: 'Live'
  },
  {
    id: '4',
    name: 'Urban Technical Parka',
    base_price: 450,
    description: 'Water-resistant outer shell with recycled down insulation for extreme winter comfort. Minimalist aesthetic meets technical utility.',
    categories: [getCategoryByName('Outerwear')],
    image: 'https://images.unsplash.com/photo-1544022613-e879a7998d0f?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1544022613-e879a7998d0f?q=80&w=800',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800',
      'https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=800',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800'
    ],
    variants: [
      {
        id: 'v4-1',
        product_id: '4',
        sku: 'UTP-FOR-M',
        color: 'Forest',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v4-1', stock: 9, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v4-1', variant_id: 'v4-1', image_url: 'https://images.unsplash.com/photo-1544022613-e879a7998d0f?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v4-2',
        product_id: '4',
        sku: 'UTP-FOR-L',
        color: 'Forest',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v4-2', stock: 14, reserved_stock: 3, low_stock_threshold: 3 }
      },
      {
        id: 'v4-3',
        product_id: '4',
        sku: 'UTP-FOR-XL',
        color: 'Forest',
        size: 'XL',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v4-3', stock: 6, reserved_stock: 0, low_stock_threshold: 3 }
      },
      {
        id: 'v4-4',
        product_id: '4',
        sku: 'UTP-NAV-M',
        color: 'Navy',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v4-4', stock: 11, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v4-4', variant_id: 'v4-4', image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v4-5',
        product_id: '4',
        sku: 'UTP-NAV-L',
        color: 'Navy',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v4-5', stock: 8, reserved_stock: 1, low_stock_threshold: 3 }
      },
      {
        id: 'v4-6',
        product_id: '4',
        sku: 'UTP-STN-L',
        color: 'Stone',
        size: 'L',
        price_override: 475,
        is_active: true,
        inventory: { variant_id: 'v4-6', stock: 4, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v4-6', variant_id: 'v4-6', image_url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=800', display_order: 1 }]
      }
    ],
    rating: 4.6,
    reviews: 38,
    featured: true,
    status: 'Live'
  },
  {
    id: '5',
    name: 'Structured Linen Blazer',
    base_price: 295,
    description: 'Breathable European linen with a sharp, contemporary fit for summer sophistication. Half-lined for comfort and movement.',
    categories: [getCategoryByName('Menswear')],
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800',
      'https://images.unsplash.com/photo-1594932224440-74ffb3f9a063?q=80&w=800',
      'https://images.unsplash.com/photo-1555069514-127ae3d6f39f?q=80&w=800'
    ],
    variants: [
      {
        id: 'v5-1',
        product_id: '5',
        sku: 'SLB-SND-38R',
        color: 'Sand',
        size: '38R',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v5-1', stock: 7, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v5-1', variant_id: 'v5-1', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v5-2',
        product_id: '5',
        sku: 'SLB-SND-40R',
        color: 'Sand',
        size: '40R',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v5-2', stock: 12, reserved_stock: 2, low_stock_threshold: 3 }
      },
      {
        id: 'v5-3',
        product_id: '5',
        sku: 'SLB-SND-42R',
        color: 'Sand',
        size: '42R',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v5-3', stock: 9, reserved_stock: 0, low_stock_threshold: 3 }
      },
      {
        id: 'v5-4',
        product_id: '5',
        sku: 'SLB-SAG-40R',
        color: 'Sage',
        size: '40R',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v5-4', stock: 6, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v5-4', variant_id: 'v5-4', image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v5-5',
        product_id: '5',
        sku: 'SLB-SAG-42R',
        color: 'Sage',
        size: '42R',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v5-5', stock: 8, reserved_stock: 1, low_stock_threshold: 3 }
      },
      {
        id: 'v5-6',
        product_id: '5',
        sku: 'SLB-SKY-44R',
        color: 'Sky',
        size: '44R',
        price_override: 315,
        is_active: true,
        inventory: { variant_id: 'v5-6', stock: 3, reserved_stock: 0, low_stock_threshold: 3 },
        images: [{ id: 'img-v5-6', variant_id: 'v5-6', image_url: 'https://images.unsplash.com/photo-1594932224440-74ffb3f9a063?q=80&w=800', display_order: 1 }]
      }
    ],
    rating: 4.5,
    reviews: 94,
    status: 'Live'
  },
  {
    id: '6',
    name: 'Asymmetric Pleated Skirt',
    base_price: 155,
    description: 'Dynamic movement through clever draping and premium heavy-weight fabric. A versatile piece that shifts from day to evening.',
    categories: [getCategoryByName('Womenswear')],
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800',
      'https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=80&w=800',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800'
    ],
    variants: [
      {
        id: 'v6-1',
        product_id: '6',
        sku: 'APS-BUR-S',
        color: 'Burgundy',
        size: 'S',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-1', stock: 15, reserved_stock: 0, low_stock_threshold: 5 },
        images: [{ id: 'img-v6-1', variant_id: 'v6-1', image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v6-2',
        product_id: '6',
        sku: 'APS-BUR-M',
        color: 'Burgundy',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-2', stock: 22, reserved_stock: 5, low_stock_threshold: 5 }
      },
      {
        id: 'v6-3',
        product_id: '6',
        sku: 'APS-BUR-L',
        color: 'Burgundy',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-3', stock: 18, reserved_stock: 0, low_stock_threshold: 5 }
      },
      {
        id: 'v6-4',
        product_id: '6',
        sku: 'APS-BLK-S',
        color: 'Black',
        size: 'S',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-4', stock: 20, reserved_stock: 2, low_stock_threshold: 5 },
        images: [{ id: 'img-v6-4', variant_id: 'v6-4', image_url: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=80&w=800', display_order: 1 }]
      },
      {
        id: 'v6-5',
        product_id: '6',
        sku: 'APS-BLK-M',
        color: 'Black',
        size: 'M',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-5', stock: 25, reserved_stock: 3, low_stock_threshold: 5 }
      },
      {
        id: 'v6-6',
        product_id: '6',
        sku: 'APS-BLK-L',
        color: 'Black',
        size: 'L',
        price_override: null,
        is_active: true,
        inventory: { variant_id: 'v6-6', stock: 12, reserved_stock: 0, low_stock_threshold: 5 }
      }
    ],
    rating: 4.9,
    reviews: 210,
    status: 'Live'
  }
];

export { CATEGORIES };
