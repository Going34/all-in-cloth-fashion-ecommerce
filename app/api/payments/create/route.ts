import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { createPaymentOrder } from '@/modules/payment/payment.service';
import { findOrderById } from '@/modules/order/order.repository';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!body.order_id || typeof body.order_id !== 'string') {
      return errorResponse(new Error('order_id is required'), 400);
    }

    const order = await findOrderById(body.order_id);

    if (!order) {
      return errorResponse(new Error('Order not found'), 404);
    }

    if (order.user_id !== user.id) {
      return errorResponse(new Error('Unauthorized'), 403);
    }

	    const idempotencyKey = body.idempotency_key || request.headers.get('idempotency-key');

	    // Determine how much the customer should pay now.
	    // For PREPAID we charge the full total. For PARTIAL_COD we
	    // only charge the fixed advance amount (₹70).
	    const clientPaymentMode = body.payment_mode as 'PREPAID' | 'COD' | 'PARTIAL_COD' | undefined;
	    const clientAdvanceAmount =
	      typeof body.advance_amount === 'number' && !Number.isNaN(body.advance_amount)
	        ? body.advance_amount
	        : undefined;

	    const isPartialCod = order.payment_mode === 'PARTIAL_COD' || clientPaymentMode === 'PARTIAL_COD';

	    let amountToPay = order.total;
	    if (isPartialCod) {
	      const advanceAmount = order.advance_payment_amount || clientAdvanceAmount || 70; // Fallback to 70 if not set
	      amountToPay = advanceAmount;
	    }

    const result = await createPaymentOrder(
      {
        order_id: body.order_id,
        method: 'razorpay',
        amount: amountToPay,
      },
      idempotencyKey || undefined
    );

    return successResponse({
      payment_id: result.payment.id,
      razorpay_order_id: result.razorpay_order.id,
      key_id: result.key_id,
      amount: result.razorpay_order.amount,
      currency: result.razorpay_order.currency,
      name: 'All in Cloth',
      description: `Order ${order.order_number}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}



