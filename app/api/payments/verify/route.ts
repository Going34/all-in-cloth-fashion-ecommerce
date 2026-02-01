import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAuth } from '@/lib/auth';
import { verifyPayment } from '@/modules/payment/payment.service';
import type { PaymentVerificationRequest } from '@/modules/payment/payment.types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return errorResponse(
        new Error('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'),
        400
      );
    }

    const verificationData: PaymentVerificationRequest = {
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    };

    const result = await verifyPayment(verificationData);

    return successResponse({
      success: result.success,
      payment_id: result.payment.id,
      payment_status: result.payment.status,
      order_status: result.order_status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}



