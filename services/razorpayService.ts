import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getSettings } from '@/modules/settings/settings.repository';

let razorpayInstance: Razorpay | null = null;

async function getRazorpayInstance(): Promise<Razorpay> {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const settings = await getSettings();
  const razorpayConfig = settings.paymentMethods.razorpay;

  if (!razorpayConfig?.enabled || !razorpayConfig.keyId || !razorpayConfig.keySecret) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables or configure in admin settings.');
  }

  razorpayInstance = new Razorpay({
    key_id: razorpayConfig.keyId,
    key_secret: razorpayConfig.keySecret,
  });

  return razorpayInstance;
}

export interface RazorpayOrderOptions {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export async function createRazorpayOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
  const razorpay = await getRazorpayInstance();

  const orderOptions: any = {
    amount: options.amount,
    currency: options.currency || 'INR',
    receipt: options.receipt,
    notes: options.notes || {},
  };

  if (options.customer) {
    orderOptions.customer = options.customer;
  }

  try {
    const order = await razorpay.orders.create(orderOptions);
    return order as RazorpayOrderResponse;
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message || 'Unknown error'}`);
  }
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyPaymentSignature(data: PaymentVerificationData): Promise<boolean> {
  const settings = await getSettings();
  const razorpayConfig = settings.paymentMethods.razorpay;

  if (!razorpayConfig?.keySecret) {
    throw new Error('Razorpay key secret not configured');
  }

  const text = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
  const generatedSignature = crypto
    .createHmac('sha256', razorpayConfig.keySecret)
    .update(text)
    .digest('hex');

  return generatedSignature === data.razorpay_signature;
}

export async function fetchPayment(paymentId: string): Promise<any> {
  const razorpay = await getRazorpayInstance();

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('Razorpay fetch payment error:', error);
    throw new Error(`Failed to fetch payment: ${error.message || 'Unknown error'}`);
  }
}

export async function fetchOrder(orderId: string): Promise<any> {
  const razorpay = await getRazorpayInstance();

  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error: any) {
    console.error('Razorpay fetch order error:', error);
    throw new Error(`Failed to fetch order: ${error.message || 'Unknown error'}`);
  }
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> {
  const razorpay = await getRazorpayInstance();

  try {
    const refundOptions: any = {
      notes: notes || {},
    };

    if (amount) {
      refundOptions.amount = amount;
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error: any) {
    console.error('Razorpay refund error:', error);
    throw new Error(`Failed to process refund: ${error.message || 'Unknown error'}`);
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return generatedSignature === signature;
}

export async function getRazorpayKeyId(): Promise<string> {
  const settings = await getSettings();
  const razorpayConfig = settings.paymentMethods.razorpay;

  if (!razorpayConfig?.enabled || !razorpayConfig.keyId) {
    throw new Error('Razorpay key ID not configured');
  }

  return razorpayConfig.keyId;
}








