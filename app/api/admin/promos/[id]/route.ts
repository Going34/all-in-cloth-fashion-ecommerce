import { NextRequest, NextResponse } from 'next/server';
import { getAdminDbClient } from '@/lib/adminDb';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = getAdminDbClient();

        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = getAdminDbClient();
        const body = await req.json();

        // Validation...

        const { data, error } = await supabase
            .from('coupons')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const { id } = await params;
        const supabase = getAdminDbClient();

        // Soft delete or hard delete? User prompt says "DELETE/:id (soft delete or mark inactive)".
        // Let's mark inactive to preserve history.

        const { error } = await supabase
            .from('coupons')
            .update({ is_active: false })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
