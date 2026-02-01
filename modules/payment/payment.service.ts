import { NotFoundError, ValidationError } from '@/lib/errors';
import {
  createPayment as createPaymentRepo,
  findPaymentById,
  findPaymentByOrderId,
} from './payment.repository';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrder,
  getRazorpayKeyId,
  type RazorpayOrderResponse,
} from '@/services/razorpayService';
import { findOrderById } from '@/modules/order/order.repository';
import { getAdminDbClient } from '@/lib/adminDb';
import type {
  CreatePaymentRequest,
  PaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
} from './payment.types';

export async function createPaymentOrder(
  data: CreatePaymentRequest,
  idempotencyKey?: string
): Promise<{
  payment: PaymentResponse;
  razorpay_order: RazorpayOrderResponse;
  key_id: string;
}> {
  const order = await findOrderById(data.order_id);

  if (!order) {
    throw new NotFoundError('Order', data.order_id);
  }

  if (order.status !== 'pending') {
    throw new ValidationError(`Cannot create payment for order with status: ${order.status}`);
  }

  const existingPayment = await findPaymentByOrderId(data.order_id);
  if (existingPayment && existingPayment.status === 'pending') {
    throw new ValidationError('Payment already exists for this order');
  }

  const amountInPaise = Math.round(data.amount * 100);

  let razorpayOrder: RazorpayOrderResponse | undefined;
  let payment: PaymentResponse | undefined;

  try {
    razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: data.order_id,
        order_number: order.order_number,
      },
    });

    payment = await createPaymentRepo(
      {
        ...data,
        razorpay_order_id: razorpayOrder.id,
      },
      idempotencyKey
    );
  } catch (error) {
    if (razorpayOrder && !payment) {
      console.error(`Razorpay order ${razorpayOrder.id} created but payment creation failed. Order may need cleanup.`);
    }
    throw error;
  }

  if (!razorpayOrder || !payment) {
    throw new Error('Failed to create payment order');
  }

  const keyId = await getRazorpayKeyId();

  return {
    payment,
    razorpay_order: razorpayOrder,
    key_id: keyId,
  };
}

export async function verifyPayment(
  data: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> {
  const isValid = await verifyPaymentSignature(data);

  if (!isValid) {
    throw new ValidationError('Invalid payment signature');
  }

  const razorpayPayment = await fetchPayment(data.razorpay_payment_id);
  const razorpayOrder = await fetchOrder(data.razorpay_order_id);

  const orderId = razorpayOrder.notes?.order_id;
  if (!orderId) {
    throw new ValidationError('Order ID not found in Razorpay order notes. Please ensure the order was created with proper notes.');
  }

  const foundPayment = await findPaymentByOrderId(orderId);
  if (!foundPayment) {
    throw new NotFoundError('Payment for order', orderId);
  }

  const paymentStatus = razorpayPayment.status === 'captured' ? 'completed' : 'failed';

  const db = getAdminDbClient();
  
  const { data: result, error: rpcError } = await db.rpc('verify_payment_transactional', {
    p_order_id: orderId,
    p_razorpay_payment_id: data.razorpay_payment_id,
    p_razorpay_order_id: data.razorpay_order_id,
    p_payment_status: paymentStatus,
    p_raw_payment_response: JSON.stringify(razorpayPayment),
    p_raw_order_response: JSON.stringify(razorpayOrder),
  });

  if (rpcError) {
    throw new Error(`Failed to verify payment: ${rpcError.message || 'Unknown error'}`);
  }

  const resultData = result as {
    success: boolean;
    payment_id: string;
    order_id: string;
    payment_status: string;
    order_status: string;
    duplicate?: boolean;
  };

  const updatedPayment = await findPaymentById(resultData.payment_id);
  if (!updatedPayment) {
    throw new Error('Failed to retrieve updated payment');
  }

  return {
    success: resultData.success,
    payment: updatedPayment,
    order_status: resultData.order_status,
  };
}

export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new NotFoundError('Payment', paymentId);
  }

  return payment;
}

export async function getPaymentByOrderId(orderId: string): Promise<PaymentResponse | null> {
  return await findPaymentByOrderId(orderId);
}

