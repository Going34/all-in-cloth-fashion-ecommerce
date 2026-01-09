import { createClient } from '@/utils/supabase/client';
import type { Coupon, CouponType } from '@/types';

const supabase = createClient();

export async function validateCoupon(code: string): Promise<{
  valid: boolean;
  coupon?: Coupon;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  const coupon = data as Coupon;

  // Check expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Coupon has expired' };
  }

  return { valid: true, coupon };
}

export async function calculateDiscount(
  coupon: Coupon,
  subtotal: number
): Promise<number> {
  if (coupon.type === 'flat') {
    return Math.min(coupon.value, subtotal);
  }

  // percent
  return (subtotal * coupon.value) / 100;
}

export async function applyCouponToOrder(
  orderId: string,
  couponId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('order_coupons')
    .insert({ order_id: orderId, coupon_id: couponId } as any);

  return { error: error as Error | null };
}

// Admin functions
export async function getAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }

  return (data as Coupon[]) || [];
}

export async function createCoupon(coupon: {
  code: string;
  type: CouponType;
  value: number;
  expires_at?: string | null;
}): Promise<{ data: Coupon | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: coupon.code.toUpperCase(),
      type: coupon.type,
      value: coupon.value,
      expires_at: coupon.expires_at,
    } as any)
    .select()
    .single();

  return { data: data as Coupon | null, error: error as Error | null };
}

export async function updateCoupon(
  id: string,
  updates: Partial<Omit<Coupon, 'id' | 'created_at'>>
): Promise<{ error: Error | null }> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at;

  const { error } = await supabase
    .from('coupons')
    .update(updateData as any)
    .eq('id', id);

  return { error: error as Error | null };
}

export async function deleteCoupon(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  return { error: error as Error | null };
}

export async function getCouponUsageStats(couponId: string): Promise<{
  totalUsed: number;
  totalDiscount: number;
}> {
  const { data, error } = await supabase
    .from('order_coupons')
    .select(`
      orders (total)
    `)
    .eq('coupon_id', couponId);

  if (error || !data) {
    return { totalUsed: 0, totalDiscount: 0 };
  }

  return {
    totalUsed: data.length,
    totalDiscount: 0, // Would need to calculate based on actual discount applied
  };
}
