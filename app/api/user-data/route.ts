import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getAdminDbClient } from '@/lib/adminDb';
import type { User, Address, Product } from '@/types';

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();
    const db = getAdminDbClient();

    // Fetch all user data in parallel
    const [profileResult, addressesResult, wishlistResult] = await Promise.all([
      // Fetch user profile
      db
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single(),

      // Fetch addresses (ordered by is_default DESC)
      db
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false }),
      
      // Fetch wishlist with product details
      db
        .from('wishlist')
        .select(`
          product_id,
          products (
            *,
            product_images (*),
            product_variants (
              *,
              inventory (*),
              variant_images (*)
            )
          )
        `)
        .eq('user_id', user.id),
    ]);

    // Handle profile result
    if (profileResult.error || !profileResult.data) {
      throw profileResult.error || new Error('User not found');
    }
    const profile = profileResult.data as User;

    // Handle addresses result
    if (addressesResult.error) {
      throw addressesResult.error;
    }
    const addresses = (addressesResult.data as Address[]) || [];

    // Handle wishlist result and transform products
    if (wishlistResult.error) {
      throw wishlistResult.error;
    }

    // Transform wishlist products similar to wishlist route
    const wishlistRows = (wishlistResult.data || []) as unknown[];
    const wishlist = wishlistRows
      .map((row) => {
        const rowObj = row as Record<string, unknown>;
        const productRaw = rowObj['products'];
        if (!productRaw || typeof productRaw !== 'object') return null;
        const product = productRaw as Record<string, unknown>;

        // Get primary image from product_images (display_order = 0) or first image
        const productImagesRaw = product['product_images'];
        const productImages = Array.isArray(productImagesRaw) ? productImagesRaw : [];
        const sortedImages = [...productImages].sort((a, b) => {
          const ao = (a && typeof a === 'object' ? (a as Record<string, unknown>)['display_order'] : 0) ?? 0;
          const bo = (b && typeof b === 'object' ? (b as Record<string, unknown>)['display_order'] : 0) ?? 0;
          return Number(ao) - Number(bo);
        });
        const primaryImage = sortedImages.length > 0 
          ? String((sortedImages[0] as Record<string, unknown>)['image_url'] || '')
          : (() => {
              const variantsRaw = product['product_variants'];
              const variants = Array.isArray(variantsRaw) ? variantsRaw : [];
              const firstVariant = variants[0] as Record<string, unknown> | undefined;
              const variantImagesRaw = firstVariant ? firstVariant['variant_images'] : undefined;
              const variantImages = Array.isArray(variantImagesRaw) ? variantImagesRaw : [];
              const firstImage = variantImages[0] as Record<string, unknown> | undefined;
              const url = firstImage ? firstImage['image_url'] : null;
              return typeof url === 'string' ? url : null;
            })();

        // Get all product images as array
        const images = sortedImages
          .map((img) => (img && typeof img === 'object' ? (img as Record<string, unknown>)['image_url'] : null))
          .filter((u): u is string => typeof u === 'string');

        // Transform product_variants to variants
        const productVariantsRaw = product['product_variants'];
        const productVariants = Array.isArray(productVariantsRaw) ? productVariantsRaw : [];
        const variants = productVariants.map((v) => {
          const vv = v as Record<string, unknown>;
          const inventoryRaw = vv['inventory'];
          const inv = inventoryRaw && typeof inventoryRaw === 'object' ? (inventoryRaw as Record<string, unknown>) : null;
          const variantImagesRaw = vv['variant_images'];
          const variantImages = Array.isArray(variantImagesRaw) ? variantImagesRaw : [];
          return {
            ...vv,
            inventory: inv
              ? {
                  variant_id: String(inv['variant_id'] || vv['id'] || ''),
                  stock: Number(inv['stock'] || 0),
                  reserved_stock: Number(inv['reserved_stock'] || 0),
                  low_stock_threshold: inv['low_stock_threshold'] ?? null,
                  updated_at: inv['updated_at'] ?? null,
                }
              : undefined,
            images: variantImages
              .map((img) => (img && typeof img === 'object' ? (img as Record<string, unknown>) : null))
              .filter((img): img is Record<string, unknown> => Boolean(img))
              .map((img) => ({
                id: String(img['id'] || ''),
                variant_id: String(img['variant_id'] || ''),
                image_url: String(img['image_url'] || ''),
                display_order: Number(img['display_order'] || 0),
              })),
          };
        });

        return {
          ...(product as unknown as Product),
          image: primaryImage || null,
          images: images.length > 0 ? images : (primaryImage ? [primaryImage] : []),
          variants: variants as unknown as Product['variants'],
        } as Product;
      })
      .filter(Boolean) as Product[];

    return successResponse({
      profile,
      addresses,
      wishlist,
    });
  } catch (error) {
    return errorResponse(error);
  }
}




