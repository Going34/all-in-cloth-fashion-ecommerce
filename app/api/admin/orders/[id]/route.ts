import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { getOrderAdmin } from '@/modules/order/order.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await getOrderAdmin(id);
    return successResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}

