import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getOrder } from '@/modules/order/order.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const order = await getOrder(id, user.id);
    return successResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}












