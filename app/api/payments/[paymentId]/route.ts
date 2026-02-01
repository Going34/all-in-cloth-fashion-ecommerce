import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { getPayment } from '@/modules/payment/payment.service';
import { findOrderById } from '@/modules/order/order.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { paymentId } = await params;
    const payment = await getPayment(paymentId);

    const order = await findOrderById(payment.order_id);

    if (!order) {
      return errorResponse(new Error('Order not found'), 404);
    }

    if (order.user_id !== user.id) {
      return errorResponse(new Error('Unauthorized'), 403);
    }

    return successResponse({
      ...payment,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: order.total,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}


