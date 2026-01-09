import { createClient } from '@/utils/supabase/client';
import type {
  Product,
  ProductVariant,
  ProductVariantInput,
  ProductStatus,
  Category,
  Inventory,
  VariantImage,
  ProductWithVariants,
} from '@/types';
import { generateSKU } from '@/utils/skuGenerator';

const supabase = createClient();

export async function getProducts(options?: {
  status?: ProductStatus;
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ProductWithVariants[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_categories (category_id, categories (*)),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.featured !== undefined) {
    query = query.eq('featured', options.featured);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  let products = ((data as any[]) || []).map(transformProduct);

  // Filter by category if specified
  if (options?.categoryId) {
    products = products.filter((p) =>
      p.categories?.some((c) => c.id === options.categoryId)
    );
  }

  return products;
}

export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (category_id, categories (*)),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching product:', error);
    return null;
  }

  return transformProduct(data);
}

export async function getProductsByCategoryId(categoryId: string): Promise<ProductWithVariants[]> {
  return getProducts({ categoryId });
}

export async function getFeaturedProducts(limit: number = 10): Promise<ProductWithVariants[]> {
  return getProducts({ featured: true, limit });
}

export async function searchProducts(query: string): Promise<ProductWithVariants[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (category_id, categories (*)),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return ((data as any[]) || []).map(transformProduct);
}

// Admin functions
export async function createProduct(
  product: {
    name: string;
    description: string;
    base_price: number;
    status?: ProductStatus;
    featured?: boolean;
  },
  categoryIds: string[],
  variants?: ProductVariantInput[]
): Promise<{ data: Product | null; error: Error | null }> {
  // Create product
  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      status: product.status || 'draft',
      featured: product.featured || false,
    } as any)
    .select()
    .single();

  if (productError || !newProduct) {
    return { data: null, error: productError as Error | null };
  }

  const productId = (newProduct as any).id;

  // Add category associations
  if (categoryIds.length > 0) {
    await supabase.from('product_categories').insert(
      categoryIds.map((catId) => ({
        product_id: productId,
        category_id: catId,
      })) as any
    );
  }

  // Create variants with inventory
  if (variants && variants.length > 0) {
    for (const variant of variants) {
      await createVariant(productId, variant);
    }
  }

  return { data: newProduct as Product, error: null };
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  categoryIds?: string[]
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('products')
    .update(updates as any)
    .eq('id', id);

  if (error) {
    return { error: error as Error };
  }

  // Update categories if provided
  if (categoryIds !== undefined) {
    // Remove old associations
    await supabase.from('product_categories').delete().eq('product_id', id);

    // Add new associations
    if (categoryIds.length > 0) {
      await supabase.from('product_categories').insert(
        categoryIds.map((catId) => ({
          product_id: id,
          category_id: catId,
        })) as any
      );
    }
  }

  return { error: null };
}

export async function deleteProduct(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error: error as Error | null };
}

export async function createVariant(
  productId: string,
  variant: ProductVariantInput
): Promise<{ data: ProductVariant | null; error: Error | null }> {
  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', productId)
    .single();

  const productName = (product as any)?.name || 'PRODUCT';
  const productCode = productName.split(' ').slice(0, 2).map((w: string) => w.substring(0, 3).toUpperCase()).join('');
  const sku = variant.sku || generateSKU('General', productCode, variant.size, variant.color);

  // Create variant
  const { data: newVariant, error: variantError } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      color: variant.color,
      size: variant.size,
      price_override: variant.price_override,
      is_active: variant.is_active ?? true,
    } as any)
    .select()
    .single();

  if (variantError || !newVariant) {
    return { data: null, error: variantError as Error | null };
  }

  const variantId = (newVariant as any).id;

  // Create inventory record
  await supabase.from('inventory').insert({
    variant_id: variantId,
    stock: variant.stock || 0,
    reserved_stock: 0,
    low_stock_threshold: variant.low_stock_threshold || 5,
  } as any);

  // Add images if provided
  if (variant.images && variant.images.length > 0) {
    await supabase.from('variant_images').insert(
      variant.images.map((url, index) => ({
        variant_id: variantId,
        image_url: url,
        display_order: index,
      })) as any
    );
  }

  return { data: newVariant as ProductVariant, error: null };
}

export async function updateVariant(
  variantId: string,
  updates: Partial<ProductVariant>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('product_variants')
    .update(updates as any)
    .eq('id', variantId);

  return { error: error as Error | null };
}

export async function deleteVariant(variantId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  return { error: error as Error | null };
}

// Helper function to transform raw product data
function transformProduct(raw: any): ProductWithVariants {
  const categories = (raw.product_categories || [])
    .map((pc: any) => pc.categories)
    .filter(Boolean);

  const variants = (raw.product_variants || []).map((v: any) => ({
    ...v,
    inventory: v.inventory || null,
    images: v.variant_images || [],
  }));

  // Get primary image from first variant or fallback
  const primaryImage =
    variants[0]?.images?.[0]?.image_url ||
    raw.image ||
    '/placeholder.jpg';

  return {
    ...raw,
    categories,
    variants,
    image: primaryImage,
    images: variants.flatMap((v: any) => v.images?.map((i: VariantImage) => i.image_url) || []),
  };
}

export async function getProductsWithRatings(limit: number = 10): Promise<ProductWithVariants[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (category_id, categories (*)),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      ),
      reviews (rating)
    `)
    .eq('status', 'live')
    .limit(limit);

  if (error) {
    console.error('Error fetching products with ratings:', error);
    return [];
  }

  return ((data as any[]) || []).map((p) => {
    const product = transformProduct(p);
    const reviews = p.reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      ...product,
      avg_rating: avgRating,
      review_count: reviews.length,
      rating: avgRating,
      reviews: reviews.length,
    };
  });
}
