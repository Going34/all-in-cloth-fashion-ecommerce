import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/services/promo';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, cartTotal } = body;

        // Basic Validation
        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
        }

        if (cartTotal === undefined || cartTotal === null || cartTotal < 0) {
            return NextResponse.json({ error: 'Valid cart total is required' }, { status: 400 });
        }

        // Identify user (optional for validation, but good context)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'guest'; // Allow validation for guests if needed, or enforce login

        const result = await PromoService.validatePromoCode(code, userId, Number(cartTotal));

        if (!result.isValid) {
            return NextResponse.json({
                valid: false,
                error: result.error,
                code: code
            }, { status: 200 }); // Return 200 even for invalid code logic to handle in UI gracefully, or 400? Prompt says: "Return validation status (valid/invalid)... Do not apply". 
            // Prompt also says "Return appropriate HTTP status codes... 400 bad request, 404 not found"
            // Usually validation endpoint returns 200 with { valid: false } or 400.
            // Let's stick to returning 200 with detailed status as it's a "validate" check, unless it's a malformed request.
            // Actually prompt says "Return validation status... reason for invalidity".
            // Let's return 200 OK with the result object.
        }

        return NextResponse.json({
            valid: true,
            code: result.coupon?.code,
            discountAmount: result.discountAmount,
            type: result.coupon?.type,
            value: result.coupon?.value
        });

    } catch (error: any) {
        console.error('Promo validation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
