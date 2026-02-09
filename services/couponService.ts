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
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  const coupon = data as Coupon;

  if (!coupon.is_active) {
    return { valid: false, error: 'Coupon is inactive' };
  }

  // Check expiration
  if (coupon.valid_till && new Date(coupon.valid_till) < new Date()) {
    return { valid: false, error: 'Coupon has expired' };
  }

  if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
    return { valid: false, error: 'Coupon is not yet valid' };
  }

  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  return { valid: true, coupon };
}

export async function calculateDiscount(
  coupon: Coupon,
  subtotal: number
): Promise<number> {
  let discount = 0;

  if (coupon.type === 'flat') {
    discount = Math.min(coupon.value, subtotal);
  } else {
    // percent
    discount = (subtotal * coupon.value) / 100;
  }

  if (coupon.max_discount) {
    discount = Math.min(discount, coupon.max_discount);
  }

  return discount;
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
  valid_till?: string | null;
  min_order_amount?: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  is_active?: boolean;
}): Promise<{ data: Coupon | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: coupon.code.toUpperCase(),
      type: coupon.type,
      value: coupon.value,
      valid_till: coupon.valid_till,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active ?? true,
      used_count: 0
    } as any)
    .select()
    .single();

  return { data: data as Coupon | null, error: error as Error | null };
}

export async function updateCoupon(
  id: string,
  updates: Partial<Omit<Coupon, 'id' | 'created_at'>>
): Promise<{ error: Error | null }> {
  // Use a type that matches the actual DB columns/Coupon interface partial
  const updateData: any = { ...updates };

  // Ensure uppercase code if present
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }

  const { error } = await supabase
    .from('coupons')
    .update(updateData)
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
  // Logic updated to check coupons.used_count directly? 
  // Or keep relying on order_coupons relation if that's still filled?
  // Let's rely on the coupon object itself for count

  const { data, error } = await supabase
    .from('coupons')
    .select('used_count')
    .eq('id', couponId)
    .single();

  if (error || !data) {
    return { totalUsed: 0, totalDiscount: 0 };
  }

  return {
    totalUsed: data.used_count,
    totalDiscount: 0, // Still placeholder as we'd need to sum promo_usage_logs for accurate total
  };
}
