import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getAdminDbClient } from '@/lib/adminDb';
import { listOrders } from '@/modules/order/order.service';
import type { User, Address, Product, Order } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const db = getAdminDbClient();

    // Fetch all user data in parallel
    const [profileResult, ordersResult, addressesResult, wishlistResult] = await Promise.all([
      // Fetch user profile
      db
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // Fetch orders (limit 10, most recent first)
      listOrders(user.id, { limit: 10 }),
      
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

    // Orders are already in the correct format from listOrders
    const orders = ordersResult || [];

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
    const wishlist = ((wishlistResult.data as any[]) || [])
      .map((item) => {
        const product = item.products;
        if (!product) return null;

        // Get primary image from product_images (display_order = 0) or first image
        const productImages = product.product_images || [];
        const sortedImages = productImages.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
        const primaryImage = sortedImages.length > 0 
          ? sortedImages[0].image_url 
          : (product.product_variants?.[0]?.variant_images?.[0]?.image_url || null);

        // Get all product images as array
        const images = sortedImages.map((img: any) => img.image_url);

        // Transform product_variants to variants
        const variants = (product.product_variants || []).map((v: any) => ({
          ...v,
          inventory: v.inventory
            ? {
                variant_id: v.inventory.variant_id || v.id,
                stock: v.inventory.stock || 0,
                reserved_stock: v.inventory.reserved_stock || 0,
                low_stock_threshold: v.inventory.low_stock_threshold || null,
                updated_at: v.inventory.updated_at || null,
              }
            : undefined,
          images: (v.variant_images || []).map((img: any) => ({
            id: img.id,
            variant_id: img.variant_id,
            image_url: img.image_url,
            display_order: img.display_order || 0,
          })),
        }));

        return {
          ...product,
          image: primaryImage,
          images: images.length > 0 ? images : (primaryImage ? [primaryImage] : []),
          variants,
        } as Product;
      })
      .filter(Boolean) as Product[];

    return successResponse({
      profile,
      orders,
      addresses,
      wishlist,
    });
  } catch (error) {
    return errorResponse(error);
  }
}




