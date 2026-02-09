import { NextRequest, NextResponse } from 'next/server';
import { getAdminDbClient } from '@/lib/adminDb';
import { requireAdmin } from '@/lib/auth';
import { CouponType } from '@/types';

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const supabase = getAdminDbClient();

        const url = new URL(req.url);
        const isActive = url.searchParams.get('is_active');

        let query = supabase.from('coupons').select('*').order('created_at', { ascending: false });

        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data: coupons, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(coupons);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const supabase = getAdminDbClient();

        const body = await req.json();
        const {
            code,
            type,
            value,
            min_order_amount,
            max_discount,
            usage_limit,
            valid_from,
            valid_till,
            is_active
        } = body;

        // Validation
        if (!code || !type || value === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (value < 0) return NextResponse.json({ error: 'Value cannot be negative' }, { status: 400 });
        if (min_order_amount < 0) return NextResponse.json({ error: 'Min order amount cannot be negative' }, { status: 400 });

        if (valid_from && valid_till && new Date(valid_from) > new Date(valid_till)) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        const { data, error } = await supabase.from('coupons').insert({
            code,
            type,
            value,
            min_order_amount: min_order_amount || 0,
            max_discount,
            usage_limit,
            valid_from,
            valid_till,
            is_active: is_active ?? true,
            used_count: 0
        }).select().single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
