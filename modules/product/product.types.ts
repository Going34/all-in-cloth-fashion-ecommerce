import type { ProductStatus, Product, ProductVariant, Category } from '@/types';

export interface ProductListQuery {
  cursor?: string;
  limit?: number;
  direction?: 'next' | 'prev';
  status?: ProductStatus;
  categoryId?: string;
  featured?: boolean;
}

export interface ProductListResponse {
  products: ProductWithDetails[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export interface ProductWithDetails extends Omit<Product, 'variants'> {
  variants: ProductVariantWithDetails[];
  categories: Category[];
  avg_rating?: number;
  review_count?: number;
}

export interface ProductVariantWithDetails extends Omit<ProductVariant, 'images' | 'inventory'> {
  inventory?: {
    stock: number;
    reserved_stock: number;
    available_stock: number;
  };
  images?: Array<{
    id: string;
    image_url: string;
    display_order: number;
    variant_id: string; // Required to match VariantImage
  }>;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  base_price: number;
  status?: ProductStatus;
  featured?: boolean;
  category_ids?: string[];
  variants?: CreateProductVariantRequest[];
  images?: string[];
  primaryImageIndex?: number;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  scheduled_publish_at?: string;
}

export interface CreateProductVariantRequest {
  id?: string; // Optional ID for updates
  sku?: string;
  color: string;
  size: string;
  price_override?: number | null;
  is_active?: boolean;
  images?: string[];
  stock?: number;
  low_stock_threshold?: number;
  attributes?: Record<string, unknown>;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  base_price?: number;
  status?: ProductStatus;
  featured?: boolean;
  category_ids?: string[];
  variants?: CreateProductVariantRequest[];
  images?: string[];
  primaryImageIndex?: number;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  scheduled_publish_at?: string;
}

export type ProductResponse = ProductWithDetails;

export interface AdminProductListQuery {
  page?: number;
  cursor?: string;
  direction?: 'next' | 'prev';
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: 'name:asc' | 'name:desc' | 'created_at:asc' | 'created_at:desc' | 'price:asc' | 'price:desc';
}

export interface AdminProductListItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  status: ProductStatus;
  featured: boolean;
  image?: string;
  categories: Category[];
  variantCount: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListResponse {
  products: AdminProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextCursor?: string | null;
    prevCursor?: string | null;
    hasMore?: boolean;
  };
}

