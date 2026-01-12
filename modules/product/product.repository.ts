import { getDbClient } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import type {
  ProductWithDetails,
  ProductVariantWithDetails,
  CreateProductRequest,
  CreateProductVariantRequest,
  UpdateProductRequest,
} from './product.types';
import type { Product, ProductStatus } from '@/types';
import { generateSKU, generateProductCode } from '@/utils/skuGenerator';

export async function findProductsByCursor(
  cursor: string | undefined,
  limit: number,
  direction: 'next' | 'prev',
  filters: {
    status?: ProductStatus;
    categoryId?: string;
    featured?: boolean;
  }
): Promise<{
  products: ProductWithDetails[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}> {
  const supabase = await getDbClient();

  // Try query with product_images first, fallback if table doesn't exist
  let query = supabase
    .from('products')
    .select(
      `
      *,
      product_categories (category_id, categories (*)),
      product_images (*),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });
  
  // Note: If product_images table doesn't exist, Supabase will return an error
  // but we'll handle it in the error check below

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  if (cursor) {
    if (direction === 'next') {
      query = query.lt('created_at', cursor);
    } else {
      query = query.gt('created_at', cursor);
    }
  }

  query = query.limit(limit + 1);

  let { data, error, count } = await query;

  // If error is due to product_images table not existing, retry without it
  if (error && (error.message?.includes('product_images') || error.message?.includes('relation') || error.code === 'PGRST116')) {
    query = supabase
      .from('products')
      .select(
        `
        *,
        product_categories (category_id, categories (*)),
        product_variants (
          *,
          inventory (*),
          variant_images (*)
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (cursor) {
      if (direction === 'next') {
        query = query.lt('created_at', cursor);
      } else {
        query = query.gt('created_at', cursor);
      }
    }

    query = query.limit(limit + 1);

    const retryResult = await query;
    data = retryResult.data;
    error = retryResult.error;
    count = retryResult.count;
  }

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const products = ((data as unknown[]) || []).map(transformProduct) as ProductWithDetails[];

  let filteredProducts = products;
  if (filters.categoryId) {
    filteredProducts = products.filter((p) =>
      p.categories?.some((c) => c.id === filters.categoryId)
    );
  }

  const hasMore = filteredProducts.length > limit;
  const resultProducts = hasMore ? filteredProducts.slice(0, limit) : filteredProducts;

  const nextCursor =
    hasMore && resultProducts.length > 0
      ? resultProducts[resultProducts.length - 1].created_at || null
      : null;
  const prevCursor = cursor || null;

  return {
    products: resultProducts,
    nextCursor,
    prevCursor,
    hasMore,
  };
}

export async function findProductById(id: string): Promise<ProductWithDetails | null> {
  const supabase = await getDbClient();

  // Try query with product_images first
  let query = supabase
    .from('products')
    .select(
      `
      *,
      product_categories (category_id, categories (*)),
      product_images (*),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `
    )
    .eq('id', id)
    .single();

  let { data, error } = await query;

  // If error is due to product_images table not existing, retry without it
  if (error && (error.message?.includes('product_images') || error.message?.includes('relation') || error.code === 'PGRST116')) {
    query = supabase
      .from('products')
      .select(
        `
        *,
        product_categories (category_id, categories (*)),
        product_variants (
          *,
          inventory (*),
          variant_images (*)
        )
      `
      )
      .eq('id', id)
      .single();

    const retryResult = await query;
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error || !data) {
    return null;
  }

  return transformProduct(data) as ProductWithDetails;
}

export async function createProduct(
  productData: CreateProductRequest
): Promise<ProductWithDetails> {
  const supabase = await getDbClient();

  const { data: newProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      description: productData.description,
      base_price: productData.base_price,
      status: productData.status || 'draft',
      featured: productData.featured || false,
    })
    .select()
    .single();

  if (productError || !newProduct) {
    throw new Error(`Failed to create product: ${productError?.message || 'Unknown error'}`);
  }

  const productId = (newProduct as Product).id;

  if (productData.category_ids && productData.category_ids.length > 0) {
    const { error: categoryError } = await supabase.from('product_categories').insert(
      productData.category_ids.map((catId) => ({
        product_id: productId,
        category_id: catId,
      }))
    );

    if (categoryError) {
      throw new Error(`Failed to associate categories: ${categoryError.message}`);
    }
  }

  // Store product images if provided (only if table exists)
  if (productData.images && productData.images.length > 0) {
    // Ensure primaryImageIndex is valid
    const primaryIndex = Math.max(0, Math.min(productData.primaryImageIndex || 0, productData.images.length - 1));
    
    // Create image records with correct display_order
    // Primary image gets display_order = 0, others get 1, 2, 3, etc.
    const imagesToInsert = productData.images.map((url: string, index: number) => ({
      product_id: productId,
      image_url: url,
      display_order: index === primaryIndex ? 0 : (index < primaryIndex ? index + 1 : index),
    }));

    // Reorder so primary image (display_order = 0) is inserted first
    // This ensures consistent ordering in the database
    const sortedImages = [
      imagesToInsert[primaryIndex], // Primary image with display_order = 0
      ...imagesToInsert.filter((_: any, idx: number) => idx !== primaryIndex), // Other images
    ].map((img: any, idx: number) => ({
      ...img,
      display_order: idx, // Ensure sequential ordering: 0, 1, 2, 3...
    }));

    const { error: imagesError } = await supabase.from('product_images').insert(sortedImages);

    // If table doesn't exist, silently skip (migration not run yet)
    if (imagesError && !imagesError.message?.includes('relation') && !imagesError.message?.includes('product_images') && imagesError.code !== 'PGRST116') {
      throw new Error(`Failed to store product images: ${imagesError.message}`);
    }
    // If table doesn't exist, we just skip storing images - they'll be available after migration
  }

  if (productData.variants && productData.variants.length > 0) {
    for (const variant of productData.variants) {
      await createVariant(productId, variant);
    }
  }

  const createdProduct = await findProductById(productId);
  if (!createdProduct) {
    throw new Error('Failed to retrieve created product');
  }

  return createdProduct;
}

async function createVariant(
  productId: string,
  variantData: CreateProductVariantRequest
): Promise<void> {
  const supabase = await getDbClient();

  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', productId)
    .single();

  const productName = (product as { name: string } | null)?.name || 'PRODUCT';
  const productCode = generateProductCode(productName);
  let sku = variantData.sku || generateSKU('General', productCode, variantData.size, variantData.color);

  // Ensure SKU uniqueness by checking if it already exists
  if (!variantData.sku) {
    let baseSku = sku;
    let counter = 1;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('sku', sku)
        .single();

      if (!existingVariant) {
        // SKU is unique, break the loop
        break;
      }

      // SKU exists, generate a new one with a suffix
      sku = `${baseSku}-${counter}`;
      counter++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based SKU if we can't find a unique one
      sku = `${baseSku}-${Date.now().toString().slice(-6)}`;
    }
  }

  const { data: newVariant, error: variantError } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      color: variantData.color,
      size: variantData.size,
      price_override: variantData.price_override,
      is_active: variantData.is_active ?? true,
    })
    .select()
    .single();

  if (variantError || !newVariant) {
    throw new Error(`Failed to create variant: ${variantError?.message || 'Unknown error'}`);
  }

  const variantId = (newVariant as { id: string }).id;

  const { error: inventoryError } = await supabase.from('inventory').insert({
    variant_id: variantId,
    stock: variantData.stock || 0,
    reserved_stock: 0,
    low_stock_threshold: variantData.low_stock_threshold || 5,
  });

  if (inventoryError) {
    throw new Error(`Failed to create inventory: ${inventoryError.message}`);
  }

  if (variantData.images && variantData.images.length > 0) {
    const { error: imagesError } = await supabase.from('variant_images').insert(
      variantData.images.map((url, index) => ({
        variant_id: variantId,
        image_url: url,
        display_order: index,
      }))
    );

    if (imagesError) {
      throw new Error(`Failed to create variant images: ${imagesError.message}`);
    }
  }
}

async function updateVariant(
  variantId: string,
  productId: string,
  variantData: CreateProductVariantRequest
): Promise<void> {
  const supabase = await getDbClient();

  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', productId)
    .single();

  const productName = (product as { name: string } | null)?.name || 'PRODUCT';
  const productCode = generateProductCode(productName);
  let sku = variantData.sku || generateSKU('General', productCode, variantData.size, variantData.color);

  // Ensure SKU uniqueness (check if another variant with this SKU exists, excluding current variant)
  if (!variantData.sku) {
    let baseSku = sku;
    let counter = 1;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('sku', sku)
        .neq('id', variantId) // Exclude current variant
        .single();

      if (!existingVariant) {
        // SKU is unique, break the loop
        break;
      }

      // SKU exists, generate a new one with a suffix
      sku = `${baseSku}-${counter}`;
      counter++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based SKU if we can't find a unique one
      sku = `${baseSku}-${Date.now().toString().slice(-6)}`;
    }
  }

  // Update variant
  const { error: variantError } = await supabase
    .from('product_variants')
    .update({
      sku,
      color: variantData.color,
      size: variantData.size,
      price_override: variantData.price_override,
      is_active: variantData.is_active ?? true,
    })
    .eq('id', variantId);

  if (variantError) {
    throw new Error(`Failed to update variant: ${variantError.message}`);
  }

  // Update inventory
  const { error: inventoryUpdateError } = await supabase
    .from('inventory')
    .update({
      stock: variantData.stock || 0,
      low_stock_threshold: variantData.low_stock_threshold || 5,
    })
    .eq('variant_id', variantId);

  if (inventoryUpdateError) {
    // If inventory doesn't exist, create it
    const { error: inventoryInsertError } = await supabase.from('inventory').insert({
      variant_id: variantId,
      stock: variantData.stock || 0,
      reserved_stock: 0,
      low_stock_threshold: variantData.low_stock_threshold || 5,
    });

    if (inventoryInsertError) {
      throw new Error(`Failed to update inventory: ${inventoryInsertError.message}`);
    }
  }

  // Update images - delete existing and insert new ones
  await supabase.from('variant_images').delete().eq('variant_id', variantId);

  if (variantData.images && variantData.images.length > 0) {
    const { error: imagesError } = await supabase.from('variant_images').insert(
      variantData.images.map((url, index) => ({
        variant_id: variantId,
        image_url: url,
        display_order: index,
      }))
    );

    if (imagesError) {
      throw new Error(`Failed to update variant images: ${imagesError.message}`);
    }
  }
}

async function deleteVariant(variantId: string): Promise<void> {
  const supabase = await getDbClient();

  // Delete variant images first
  const { error: imagesError } = await supabase.from('variant_images').delete().eq('variant_id', variantId);
  if (imagesError) {
    throw new Error(`Failed to delete variant images: ${imagesError.message}`);
  }

  // Delete inventory
  const { error: inventoryError } = await supabase.from('inventory').delete().eq('variant_id', variantId);
  if (inventoryError) {
    throw new Error(`Failed to delete inventory: ${inventoryError.message}`);
  }

  // Delete variant
  const { error: variantError } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (variantError) {
    throw new Error(`Failed to delete variant: ${variantError.message}`);
  }
}

function transformProduct(raw: unknown): ProductWithDetails {
  const data = raw as any;
  const categories = (data.product_categories || [])
    .map((pc: any) => pc.categories)
    .filter(Boolean);

  // Map product images - sort by display_order (primary image has display_order = 0)
  const sortedProductImages = (data.product_images || [])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
  
  const productImages = sortedProductImages.map((img: any) => img.image_url);
  
  // Find primary image index - the image with display_order = 0 should be at index 0 after sorting
  // But we need to find its position in case the sorting didn't work as expected
  const primaryImageIndex = sortedProductImages.length > 0 
    ? sortedProductImages.findIndex((img: any) => (img.display_order || 0) === 0)
    : 0;
  
  // Ensure primaryImageIndex is valid (fallback to 0 if not found)
  const validPrimaryImageIndex = primaryImageIndex >= 0 && primaryImageIndex < productImages.length 
    ? primaryImageIndex 
    : (productImages.length > 0 ? 0 : 0);
  
  // Set primary image from first product image or first variant image
  const primaryImage = productImages.length > 0 
    ? productImages[validPrimaryImageIndex] 
    : (data.product_variants?.[0]?.variant_images?.[0]?.image_url || null);

  const variants = (data.product_variants || []).map((v: any) => ({
    ...v,
    inventory: v.inventory
      ? {
          stock: v.inventory.stock || 0,
          reserved_stock: v.inventory.reserved_stock || 0,
          available_stock: (v.inventory.stock || 0) - (v.inventory.reserved_stock || 0),
        }
      : undefined,
    images: (v.variant_images || []).map((img: any) => ({
      id: img.id,
      image_url: img.image_url,
      display_order: img.display_order || 0,
    })),
  }));

  return {
    ...data,
    categories,
    variants,
    images: productImages.length > 0 ? productImages : undefined,
    image: primaryImage,
    primaryImageIndex: productImages.length > 0 ? validPrimaryImageIndex : undefined,
  };
}

export async function findProductsAdmin(filters: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: 'name:asc' | 'name:desc' | 'created_at:asc' | 'created_at:desc' | 'price:asc' | 'price:desc';
}): Promise<{
  products: any[];
  total: number;
}> {
  const supabase = await getDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Try query with product_images first, fallback if table doesn't exist
  let query = supabase
    .from('products')
    .select(
      `
      *,
      product_categories (category_id, categories (*)),
      product_images (*),
      product_variants (
        *,
        inventory (*),
        variant_images (*)
      )
    `,
      { count: 'exact' }
    );

  // Apply filters before executing query
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const sortField = filters.sort?.split(':')[0] || 'created_at';
  const sortOrder = filters.sort?.split(':')[1] === 'asc' ? true : false;
  query = query.order(sortField, { ascending: sortOrder });

  query = query.range(offset, offset + limit - 1);

  let { data, error, count } = await query;

  // If error is due to product_images table not existing, retry without it
  if (error && (error.message?.includes('product_images') || error.message?.includes('relation') || error.code === 'PGRST116')) {
    query = supabase
      .from('products')
      .select(
        `
        *,
        product_categories (category_id, categories (*)),
        product_variants (
          *,
          inventory (*),
          variant_images (*)
        )
      `,
        { count: 'exact' }
      );

    // Re-apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query.order(sortField, { ascending: sortOrder });
    query = query.range(offset, offset + limit - 1);

    const retryResult = await query;
    data = retryResult.data;
    error = retryResult.error;
    count = retryResult.count;
  }

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  let products = ((data as unknown[]) || []).map(transformProduct);

  if (filters.category) {
    products = products.filter((p) => p.categories?.some((c) => c.name === filters.category));
  }

  const adminProducts = products.map((product) => {
    const variants = product.variants || [];
    const totalStock = variants.reduce((sum, v) => {
      const stock = v.inventory?.stock || 0;
      return sum + stock;
    }, 0);

    // Get primary image from product_images first, fallback to variant images
    const primaryImage = product.image || 
                        (product.images && product.images.length > 0 ? product.images[0] : null) ||
                        (variants[0]?.images?.[0]?.image_url || null);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.base_price,
      status: product.status,
      featured: product.featured || false,
      image: primaryImage,
      categories: product.categories || [],
      variantCount: variants.length,
      totalStock,
      createdAt: product.created_at || '',
      updatedAt: product.updated_at || '',
    };
  });

  return {
    products: adminProducts,
    total: count || 0,
  };
}

export async function updateProductAdmin(
  id: string,
  updates: UpdateProductRequest
): Promise<ProductWithDetails> {
  const supabase = await getDbClient();

  // Update basic product fields
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.base_price !== undefined) updateData.base_price = updates.base_price;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.featured !== undefined) updateData.featured = updates.featured;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from('products').update(updateData).eq('id', id);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  // Update categories
  if (updates.category_ids !== undefined) {
    await supabase.from('product_categories').delete().eq('product_id', id);

    if (updates.category_ids.length > 0) {
      const { error: categoryError } = await supabase.from('product_categories').insert(
        updates.category_ids.map((catId) => ({
          product_id: id,
          category_id: catId,
        }))
      );

      if (categoryError) {
        throw new Error(`Failed to update categories: ${categoryError.message}`);
      }
    }
  }

  // Update product images (only if table exists)
  if (updates.images !== undefined) {
    // Delete existing product images
    const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', id);
    
    // If table doesn't exist, silently skip (migration not run yet)
    if (deleteError && !deleteError.message?.includes('relation') && !deleteError.message?.includes('product_images') && deleteError.code !== 'PGRST116') {
      throw new Error(`Failed to delete existing product images: ${deleteError.message}`);
    }

    // Insert new product images if provided
    if (updates.images.length > 0) {
      // Ensure primaryImageIndex is valid
      const primaryIndex = Math.max(0, Math.min(updates.primaryImageIndex || 0, updates.images.length - 1));
      
      // Create image records with correct display_order
      // Primary image gets display_order = 0, others get 1, 2, 3, etc.
      const imagesToInsert = updates.images.map((url, index) => ({
        product_id: id,
        image_url: url,
        display_order: index === primaryIndex ? 0 : (index < primaryIndex ? index + 1 : index),
      }));

      // Reorder so primary image (display_order = 0) is inserted first
      // This ensures consistent ordering in the database
      const sortedImages = [
        imagesToInsert[primaryIndex], // Primary image with display_order = 0
        ...imagesToInsert.filter((_, idx) => idx !== primaryIndex), // Other images
      ].map((img, idx) => ({
        ...img,
        display_order: idx, // Ensure sequential ordering: 0, 1, 2, 3...
      }));

      const { error: imagesError } = await supabase.from('product_images').insert(sortedImages);

      // If table doesn't exist, silently skip (migration not run yet)
      if (imagesError && !imagesError.message?.includes('relation') && !imagesError.message?.includes('product_images') && imagesError.code !== 'PGRST116') {
        throw new Error(`Failed to update product images: ${imagesError.message}`);
      }
    } else {
      // If images array is empty, all images have been removed
      // This is handled by the delete above, so no action needed here
    }
  }

  // Handle variants update
  if (updates.variants !== undefined) {
    // Fetch existing variants for this product
    const { data: existingVariants, error: fetchError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id);

    if (fetchError) {
      throw new Error(`Failed to fetch existing variants: ${fetchError.message}`);
    }

    const existingVariantIds = new Set((existingVariants || []).map((v: any) => v.id));
    const incomingVariantIds = new Set(
      updates.variants.filter((v) => v.id && typeof v.id === 'string').map((v) => v.id as string)
    );

    // Delete variants that are no longer in the incoming list
    const variantsToDelete = Array.from(existingVariantIds).filter((variantId) => !incomingVariantIds.has(variantId));
    for (const variantId of variantsToDelete) {
      await deleteVariant(variantId);
    }

    // Process each incoming variant
    for (const variantData of updates.variants) {
      if (variantData.id && typeof variantData.id === 'string' && existingVariantIds.has(variantData.id)) {
        // Update existing variant that belongs to this product
        await updateVariant(variantData.id, id, variantData);
      } else {
        // Create new variant (either no ID or ID doesn't exist for this product)
        // Create without the ID field
        const { id: _, ...variantDataWithoutId } = variantData;
        await createVariant(id, variantDataWithoutId);
      }
    }
  }

  const updatedProduct = await findProductById(id);
  if (!updatedProduct) {
    throw new Error('Failed to retrieve updated product');
  }

  return updatedProduct;
}

export async function deleteProductAdmin(id: string): Promise<void> {
  const supabase = await getDbClient();

  // 1. Validate product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .single();

  if (productError || !product) {
    throw new Error(`Product not found: ${productError?.message || 'Product does not exist'}`);
  }

  // 2. Get all variants for this product
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id);

  if (variantsError) {
    throw new Error(`Failed to fetch product variants: ${variantsError.message}`);
  }

  // 3. Check if any variants are referenced in order_items
  if (variants && variants.length > 0) {
    const variantIds = variants.map((v) => v.id);
    
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .in('variant_id', variantIds)
      .limit(1);

    if (orderItemsError) {
      throw new Error(`Failed to check order items: ${orderItemsError.message}`);
    }

    if (orderItems && orderItems.length > 0) {
      throw new Error('Cannot delete product that has been ordered');
    }
  }

  // 4. Delete variant-related data (if variants exist)
  if (variants && variants.length > 0) {
    const variantIds = variants.map((v) => v.id);

    // Delete variant images
    const { error: variantImagesError } = await supabase
      .from('variant_images')
      .delete()
      .in('variant_id', variantIds);

    if (variantImagesError) {
      throw new Error(`Failed to delete variant images: ${variantImagesError.message}`);
    }

    // Delete inventory records
    const { error: inventoryError } = await supabase
      .from('inventory')
      .delete()
      .in('variant_id', variantIds);

    if (inventoryError) {
      throw new Error(`Failed to delete inventory: ${inventoryError.message}`);
    }

    // Delete cart items (explicit for clarity, though CASCADE handles it)
    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .delete()
      .in('variant_id', variantIds);

    if (cartItemsError) {
      throw new Error(`Failed to delete cart items: ${cartItemsError.message}`);
    }

    // Delete product variants
    const { error: variantsDeleteError } = await supabase
      .from('product_variants')
      .delete()
      .in('id', variantIds);

    if (variantsDeleteError) {
      throw new Error(`Failed to delete product variants: ${variantsDeleteError.message}`);
    }
  }

  // 5. Delete product categories
  const { error: categoriesError } = await supabase
    .from('product_categories')
    .delete()
    .eq('product_id', id);

  if (categoriesError) {
    throw new Error(`Failed to delete product categories: ${categoriesError.message}`);
  }

  // 6. Delete reviews (CASCADE handles it, but explicit for clarity)
  const { error: reviewsError } = await supabase
    .from('reviews')
    .delete()
    .eq('product_id', id);

  if (reviewsError) {
    throw new Error(`Failed to delete reviews: ${reviewsError.message}`);
  }

  // 7. Delete wishlist items (CASCADE handles it, but explicit for clarity)
  const { error: wishlistError } = await supabase
    .from('wishlist')
    .delete()
    .eq('product_id', id);

  if (wishlistError) {
    throw new Error(`Failed to delete wishlist items: ${wishlistError.message}`);
  }

  // 8. Finally, delete the product itself
  const { error: productDeleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (productDeleteError) {
    throw new Error(`Failed to delete product: ${productDeleteError.message}`);
  }
}

