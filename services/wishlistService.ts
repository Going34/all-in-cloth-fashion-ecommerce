import { createClient } from '@/utils/supabase/client';
import type { Product, WishlistItem } from '@/types';

const supabase = createClient();

export async function getWishlist(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      product_id,
      products (
        *,
        product_variants (
          *,
          inventory (*),
          variant_images (*)
        )
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }

  return ((data as any[]) || [])
    .map((item) => item.products)
    .filter(Boolean);
}

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('wishlist')
    .insert({ user_id: userId, product_id: productId } as any);

  return { error: error as Error | null };
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  return { error: error as Error | null };
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  return !error && !!data;
}

export async function toggleWishlistItem(
  userId: string,
  productId: string
): Promise<{ added: boolean; error: Error | null }> {
  const inWishlist = await isInWishlist(userId, productId);

  if (inWishlist) {
    const { error } = await removeFromWishlist(userId, productId);
    return { added: false, error };
  } else {
    const { error } = await addToWishlist(userId, productId);
    return { added: true, error };
  }
}

export async function getWishlistCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('wishlist')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function clearWishlist(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('wishlist').delete().eq('user_id', userId);
  return { error: error as Error | null };
}
