import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { updateOrderStatusAdmin } from '@/modules/order/order.service';
import type { OrderStatus } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    console.log('[ORDER STATUS UPDATE] Request:', { id, status, notes });

    if (!status || typeof status !== 'string') {
      console.error('[ORDER STATUS UPDATE] Status validation failed:', { status, type: typeof status });
      return errorResponse(new Error('Status is required'), 400);
    }

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.error('[ORDER STATUS UPDATE] Invalid status:', { status, validStatuses });
      return errorResponse(new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`), 400);
    }

    const order = await updateOrderStatusAdmin(id, status as OrderStatus, notes);
    console.log('[ORDER STATUS UPDATE] Success:', { id, status });
    return successResponse(order);
  } catch (error) {
    console.error('[ORDER STATUS UPDATE] Error:', error);
    return errorResponse(error);
  }
}

