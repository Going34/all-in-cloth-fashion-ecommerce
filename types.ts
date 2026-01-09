// =====================================================
// Database Types for Supabase
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum Types
export type RoleType = "USER" | "ADMIN" | "OPS";
export type ProductStatus = "draft" | "live";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type TransactionStatus = "pending" | "success" | "failed" | "refunded";
export type CouponType = "flat" | "percent";

// Legacy types for backward compatibility
export type AdminRole = "Admin" | "Ops" | "Support";

// =====================================================
// Database Table Types (with optional timestamps for mock data compatibility)
// =====================================================

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: RoleType;
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  status?: ProductStatus | 'Draft' | 'Live';
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  // UI display fields (populated from related tables)
  image?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  categories?: Category[];
  variants?: ProductVariant[];
  primaryImageIndex?: number;
  category?: string;
  price?: number;
  // Admin list view fields (from API response)
  variantCount?: number;
  totalStock?: number;
}

export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  price_override?: number | null;
  is_active?: boolean;
  // UI display fields (populated from related tables)
  images?: VariantImage[];
  inventory?: Inventory;
}

export interface VariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  display_order?: number;
}

export interface Inventory {
  variant_id: string;
  stock: number;
  reserved_stock?: number;
  low_stock_threshold?: number;
  updated_at?: string;
}

export interface CartItemRow {
  user_id: string;
  variant_id: string;
  quantity: number;
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  image_url: string;
  quantity: number;
}

export interface WishlistItem {
  user_id: string;
  product_id: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  price_snapshot: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status?: PaymentStatus;
  created_at?: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  gateway: string;
  gateway_txn_id?: string | null;
  raw_response?: Json | null;
  status?: TransactionStatus;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  expires_at?: string | null;
  created_at?: string;
}

export interface OrderCoupon {
  order_id: string;
  coupon_id: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  entity: string;
  entity_id: string;
  action: string;
  old_value?: Json | null;
  new_value?: Json | null;
  created_at?: string;
}

// =====================================================
// Database Type for Supabase Client
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { id: string; email: string };
        Update: Partial<User>;
      };
      roles: {
        Row: Role;
        Insert: Partial<Role> & { name: RoleType };
        Update: Partial<Role>;
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRole;
        Update: Partial<UserRole>;
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { name: string; description: string; base_price: number };
        Update: Partial<Product>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name: string };
        Update: Partial<Category>;
      };
      product_categories: {
        Row: ProductCategory;
        Insert: ProductCategory;
        Update: Partial<ProductCategory>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Partial<ProductVariant> & { product_id: string; sku: string; color: string; size: string };
        Update: Partial<ProductVariant>;
      };
      variant_images: {
        Row: VariantImage;
        Insert: Partial<VariantImage> & { variant_id: string; image_url: string };
        Update: Partial<VariantImage>;
      };
      inventory: {
        Row: Inventory;
        Insert: Partial<Inventory> & { variant_id: string; stock: number };
        Update: Partial<Inventory>;
      };
      cart_items: {
        Row: CartItemRow;
        Insert: CartItemRow;
        Update: Partial<CartItemRow>;
      };
      wishlist: {
        Row: WishlistItem;
        Insert: WishlistItem;
        Update: Partial<WishlistItem>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { user_id: string; subtotal: number; total: number };
        Update: Partial<Order>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: Partial<OrderStatusHistory> & { order_id: string; status: OrderStatus };
        Update: Partial<OrderStatusHistory>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & { order_id: string; product_name_snapshot: string; sku_snapshot: string; price_snapshot: number; quantity: number };
        Update: Partial<OrderItem>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { order_id: string; method: string; amount: number };
        Update: Partial<Payment>;
      };
      payment_transactions: {
        Row: PaymentTransaction;
        Insert: Partial<PaymentTransaction> & { payment_id: string; gateway: string };
        Update: Partial<PaymentTransaction>;
      };
      addresses: {
        Row: Address;
        Insert: Partial<Address> & { user_id: string; name: string; street: string; city: string; state: string; zip: string; country: string; phone: string };
        Update: Partial<Address>;
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review> & { product_id: string; user_id: string; rating: number };
        Update: Partial<Review>;
      };
      coupons: {
        Row: Coupon;
        Insert: Partial<Coupon> & { code: string; type: CouponType; value: number };
        Update: Partial<Coupon>;
      };
      order_coupons: {
        Row: OrderCoupon;
        Insert: OrderCoupon;
        Update: Partial<OrderCoupon>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & { entity: string; entity_id: string; action: string };
        Update: Partial<AuditLog>;
      };
    };
    Views: {
      products_with_ratings: {
        Row: Product & {
          avg_rating: number;
          review_count: number;
        };
      };
      inventory_status: {
        Row: {
          variant_id: string;
          product_id: string;
          sku: string;
          color: string;
          size: string;
          product_name: string;
          stock: number;
          reserved_stock: number;
          low_stock_threshold: number;
          available_stock: number;
          status: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      reserve_inventory: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: boolean;
      };
    };
    Enums: {
      role_type: RoleType;
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      transaction_status: TransactionStatus;
      coupon_type: CouponType;
    };
  };
}

// =====================================================
// Extended Types with Relations (for UI components)
// =====================================================

export interface ProductWithVariants extends Product {
  variants: ProductVariantWithInventory[];
  categories: Category[];
  avg_rating?: number;
  review_count?: number;
}

export interface ProductVariantWithInventory extends ProductVariant {
  inventory?: Inventory;
  images?: VariantImage[];
}

export interface CartItemWithDetails extends CartItemRow {
  product: Product;
  variant: ProductVariant;
  images: VariantImage[];
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface UserWithRoles extends User {
  roles: Role[];
}

// =====================================================
// Input Types for Forms
// =====================================================

export interface ProductInput {
  name: string;
  description: string;
  base_price: number;
  status?: ProductStatus;
  featured?: boolean;
  category_ids?: string[];
  variants?: ProductVariantInput[];
}

export interface ProductVariantInput {
  sku: string;
  color: string;
  size: string;
  price_override?: number | null;
  is_active?: boolean;
  images?: string[];
  stock?: number;
  low_stock_threshold?: number;
}

export interface AddressInput {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

export interface ReviewInput {
  product_id: string;
  rating: number;
  comment?: string;
}

export interface OrderInput {
  items: {
    variant_id: string;
    quantity: number;
  }[];
  address_id: string;
  coupon_code?: string;
}

// =====================================================
// Inventory Status Types
// =====================================================

export type InventoryStatusType = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  color: string;
  size: string;
  stock: number;
  reserved_stock: number;
  low_stock_threshold: number;
  available_stock: number;
  status: InventoryStatusType;
}
