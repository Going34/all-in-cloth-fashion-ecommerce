import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { verifyWebhookSignature } from '@/services/razorpayService';
import { getSettings } from '@/modules/settings/settings.repository';
import {
  findPaymentByOrderId,
  updatePaymentStatus,
} from '@/modules/payment/payment.repository';

interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        acquirer_data: Record<string, unknown>;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string;
        offer_id: string | null;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
      };
    };
  };
  created_at: number;
}

async function validateWebhookSignature(
  request: NextRequest,
  payload: string
): Promise<boolean> {
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return false;
  }

  const settings = await getSettings();
  const webhookSecret = settings.paymentMethods.razorpay?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Razorpay webhook secret not configured, skipping signature verification');
    return true;
  }

  return verifyWebhookSignature(payload, signature, webhookSecret);
}

async function handlePaymentCaptured(event: RazorpayWebhookEvent): Promise<void> {
  const payment = event.payload.payment?.entity;

  if (!payment) {
    throw new Error('Payment data not found in webhook payload');
  }

  const orderId = payment.notes?.order_id;
  if (!orderId) {
    throw new Error('Order ID not found in payment notes');
  }

  const dbPayment = await findPaymentByOrderId(orderId);

  if (!dbPayment) {
    console.warn(`Payment not found for order ${orderId}`);
    return;
  }

  await updatePaymentStatus(
    dbPayment.id,
    {
      status: 'completed',
      gateway_txn_id: payment.id,
      raw_response: payment,
    },
    'paid',
    payment.order_id
  );

  console.log(`Payment ${payment.id} captured for order ${orderId}`);
}

async function handlePaymentFailed(event: RazorpayWebhookEvent): Promise<void> {
  const payment = event.payload.payment?.entity;

  if (!payment) {
    throw new Error('Payment data not found in webhook payload');
  }

  const orderId = payment.notes?.order_id;
  if (!orderId) {
    throw new Error('Order ID not found in payment notes');
  }

  const dbPayment = await findPaymentByOrderId(orderId);

  if (!dbPayment) {
    console.warn(`Payment not found for order ${orderId}`);
    return;
  }

  await updatePaymentStatus(
    dbPayment.id,
    {
      status: 'failed',
      gateway_txn_id: payment.id,
      raw_response: payment,
    },
    'cancelled',
    payment.order_id
  );

  console.log(`Payment ${payment.id} failed for order ${orderId}`);
}

async function handleOrderPaid(event: RazorpayWebhookEvent): Promise<void> {
  const order = event.payload.order?.entity;

  if (!order) {
    throw new Error('Order data not found in webhook payload');
  }

  const orderId = order.notes?.order_id;
  if (!orderId) {
    throw new Error('Order ID not found in order notes');
  }

  const dbPayment = await findPaymentByOrderId(orderId);

  if (!dbPayment) {
    console.warn(`Payment not found for order ${orderId}`);
    return;
  }

  await updatePaymentStatus(
    dbPayment.id,
    {
      status: 'completed',
      gateway_txn_id: order.id,
      raw_response: order,
    },
    'paid',
    order.id
  );

  console.log(`Order ${order.id} paid for order ${orderId}`);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const isValid = await validateWebhookSignature(request, rawBody);

    if (!isValid) {
      return errorResponse(new Error('Invalid webhook signature'), 401);
    }

    const event: RazorpayWebhookEvent = JSON.parse(rawBody);

    console.log(`Received Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'order.paid':
        await handleOrderPaid(event);
        break;

      case 'payment.authorized':
      case 'payment.refunded':
      case 'refund.created':
        console.log(`Webhook event ${event.event} received but not handled`);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return successResponse({ received: true, event: event.event });
  } catch (error: unknown) {
    console.error('Razorpay webhook error:', error);
    return errorResponse(error, 500);
  }
}

export async function GET() {
  return successResponse({ status: 'ok', service: 'razorpay-webhook' });
}



