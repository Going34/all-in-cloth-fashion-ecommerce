import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/services/promo';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, orderId, cartTotal } = body;

        if (!code || !orderId || cartTotal === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const result = await PromoService.applyPromoCode(code, orderId, user.id, Number(cartTotal));
            return NextResponse.json(result);
        } catch (error: any) {
            console.error('Promo apply error:', error);
            // Map error messages to status codes
            if (error.message === 'A promo code has already been applied to this order') {
                return NextResponse.json({ error: error.message }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Internal promo error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
