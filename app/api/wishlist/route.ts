import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getDbClient } from '@/lib/db';
import type { Product } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await getDbClient();

    const { data, error } = await supabase
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
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // Transform products to include primary image and variants
    const wishlist = ((data as any[]) || [])
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

    return successResponse(wishlist);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return errorResponse(new Error('product_id is required'), 400);
    }

    const supabase = await getDbClient();

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      return successResponse({ message: 'Product already in wishlist' });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id } as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return errorResponse(new Error('product_id is required'), 400);
    }

    const supabase = await getDbClient();

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) {
      throw error;
    }

    return successResponse({ message: 'Product removed from wishlist' });
  } catch (error) {
    return errorResponse(error);
  }
}

