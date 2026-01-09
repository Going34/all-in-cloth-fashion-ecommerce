import { createClient } from '@/utils/supabase/client';
import type { CartItem, CartItemRow, Product, ProductVariant, VariantImage } from '@/types';

const supabase = createClient();

export interface CartItemWithDetails {
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

export async function getCart(userId: string): Promise<CartItemWithDetails[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product_variants (
        *,
        products (*),
        variant_images (*)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching cart:', error);
    return [];
  }

  return ((data as any[]) || []).map((item) => {
    const variant = item.product_variants;
    const product = variant?.products;
    const images = variant?.variant_images || [];
    const price = variant?.price_override ?? product?.base_price ?? 0;
    const imageUrl = images[0]?.image_url || product?.image || '';

    return {
      variant_id: item.variant_id,
      product_id: product?.id || '',
      product_name: product?.name || '',
      sku: variant?.sku || '',
      color: variant?.color || '',
      size: variant?.size || '',
      price,
      image_url: imageUrl,
      quantity: item.quantity,
    };
  });
}

export async function addToCart(
  userId: string,
  variantId: string,
  quantity: number = 1
): Promise<{ error: Error | null }> {
  // Check if item already exists in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('variant_id', variantId)
    .single();

  if (existing) {
    // Update quantity
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: (existing as any).quantity + quantity } as any)
      .eq('user_id', userId)
      .eq('variant_id', variantId);
    return { error: error as Error | null };
  }

  // Insert new item
  const { error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, variant_id: variantId, quantity } as any);

  return { error: error as Error | null };
}

export async function updateCartItemQuantity(
  userId: string,
  variantId: string,
  quantity: number
): Promise<{ error: Error | null }> {
  if (quantity <= 0) {
    return removeFromCart(userId, variantId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity } as any)
    .eq('user_id', userId)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function removeFromCart(
  userId: string,
  variantId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('variant_id', variantId);

  return { error: error as Error | null };
}

export async function clearCart(userId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  return { error: error as Error | null };
}

export async function getCartItemCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId);

  if (error || !data) return 0;

  return (data as any[]).reduce((sum, item) => sum + item.quantity, 0);
}

export async function mergeGuestCart(
  userId: string,
  guestCart: CartItem[]
): Promise<{ error: Error | null }> {
  for (const item of guestCart) {
    await addToCart(userId, item.variant_id, item.quantity);
  }
  return { error: null };
}
