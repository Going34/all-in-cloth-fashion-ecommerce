import { getAdminDbClient } from '@/lib/adminDb';
import { Coupon, CouponType } from '@/types';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    discountAmount: number;
    coupon?: Coupon;
}

export class PromoService {

    static async validatePromoCode(code: string, userId: string, cartTotal: number): Promise<ValidationResult> {
        const supabase = getAdminDbClient();

        // 1. Fetch Coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (error) {
            console.error('Error fetching coupon:', error);
            return { isValid: false, error: 'Error validating promo code', discountAmount: 0 };
        }

        if (!coupon) {
            return { isValid: false, error: 'Invalid promo code', discountAmount: 0 };
        }

        // 2. Check Active Status
        if (!coupon.is_active) {
            return { isValid: false, error: 'Promo code is inactive', discountAmount: 0 };
        }

        const now = new Date();

        // 3. Check Date Validity
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return { isValid: false, error: 'Promo code is not yet valid', discountAmount: 0 };
        }

        if (coupon.valid_till && new Date(coupon.valid_till) < now) {
            return { isValid: false, error: 'Promo code has expired', discountAmount: 0 };
        }

        // 4. Check Usage Limit
        if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
            return { isValid: false, error: 'Promo code usage limit reached', discountAmount: 0 };
        }

        // 5. Check Minimum Order Amount
        // Ensure numeric comparison
        if (Number(cartTotal) < Number(coupon.min_order_amount || 0)) {
            return {
                isValid: false,
                error: `Minimum order amount of ${coupon.min_order_amount} required`,
                discountAmount: 0
            };
        }

        // 6. Calculate Discount
        const discountAmount = this.calculateDiscount(coupon, cartTotal);

        return {
            isValid: true,
            discountAmount,
            coupon
        };
    }

    static calculateDiscount(coupon: Coupon, cartTotal: number): number {
        let discount = 0;
        const total = Number(cartTotal);

        if (coupon.type === 'percent') {
            discount = (total * coupon.value) / 100;
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        } else if (coupon.type === 'flat') {
            discount = coupon.value;
            // Flat discount shouldn't exceed cart total
            if (discount > total) {
                discount = total;
            }
            // Also respect max_discount if set for flat
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        }

        // Ensure no negative values and round to 2 decimals
        return Math.max(0, Math.round(discount * 100) / 100);
    }

    static async applyPromoCode(code: string, orderId: string, userId: string, cartTotal: number) {
        const supabase = getAdminDbClient();

        console.log('[PROMO] Applying promo code:', { code, orderId, userId, cartTotal });

        // 1. Re-validate
        const validation = await this.validatePromoCode(code, userId, cartTotal);
        if (!validation.isValid || !validation.coupon) {
            console.error('[PROMO] Validation failed:', validation.error);
            throw new Error(validation.error || 'Invalid promo code');
        }

        const coupon = validation.coupon;
        console.log('[PROMO] Validation successful. Coupon:', coupon.code, 'Discount:', validation.discountAmount);

        // 2. Idempotency Check (Check if THIS code is already applied to THIS order)
        const { data: existingUsage, error: existingUsageError } = await supabase
            .from('promo_usage_logs')
            .select('*')
            .eq('order_id', orderId)
            .eq('promo_code', code)
            .maybeSingle();

        if (existingUsageError) {
            console.error('[PROMO] Error checking existing usage:', existingUsageError);
            throw new Error(`Failed to check promo code usage: ${existingUsageError.message}`);
        }

        if (existingUsage) {
            // Idempotency: If already applied for this order, just return success
            console.log('[PROMO] Promo code already applied to this order (idempotent)');
            return { success: true, discountAmount: existingUsage.discount_amount, message: 'Promo already applied' };
        }

        // 3. One-Per-Order Check (Check if ANY code is already applied to THIS order)
        const { data: anyUsage, error: anyUsageError } = await supabase
            .from('promo_usage_logs')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (anyUsageError) {
            console.error('[PROMO] Error checking any usage:', anyUsageError);
            throw new Error(`Failed to check order promo usage: ${anyUsageError.message}`);
        }

        if (anyUsage) {
            console.error('[PROMO] Another promo code already applied:', anyUsage.promo_code);
            throw new Error('A promo code has already been applied to this order');
        }

        // 4. Update Usage Count
        // Optimistic update without RPC for now.
        const { error: incrementError } = await supabase
            .from('coupons')
            .update({ used_count: coupon.used_count + 1 })
            .eq('id', coupon.id);

        if (incrementError) {
            console.error('[PROMO] Error incrementing usage count:', incrementError);
            console.error('[PROMO] Increment error details:', JSON.stringify(incrementError, null, 2));
            throw new Error(`Failed to update promo usage count: ${incrementError.message}`);
        }

        console.log('[PROMO] Usage count incremented successfully');

        // 5. Log Usage
        const { error: logError } = await supabase
            .from('promo_usage_logs')
            .insert({
                order_id: orderId,
                user_id: userId,
                promo_code: code,
                discount_amount: validation.discountAmount
            });

        if (logError) {
            console.error('[PROMO] Error logging usage:', logError);
            console.error('[PROMO] Log error details:', JSON.stringify(logError, null, 2));
            console.error('[PROMO] Log error code:', logError.code);
            console.error('[PROMO] Log error hint:', logError.hint);

            // Rollback (best effort)
            console.log('[PROMO] Rolling back usage count increment');
            await supabase.from('coupons').update({ used_count: coupon.used_count }).eq('id', coupon.id);

            throw new Error(`Failed to log promo usage: ${logError.message || logError.code || 'Unknown error'}`);
        }

        console.log('[PROMO] Promo code applied successfully');
        return {
            success: true,
            discountAmount: validation.discountAmount
        };
    }
}
