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

    if (!status || typeof status !== 'string') {
      return errorResponse(new Error('Status is required'), 400);
    }

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`), 400);
    }

    const order = await updateOrderStatusAdmin(id, status as OrderStatus, notes);
    return successResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}

