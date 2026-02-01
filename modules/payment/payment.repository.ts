import { getAdminDbClient } from '@/lib/adminDb';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { Payment, PaymentStatus, PaymentTransaction } from '@/types';
import type { CreatePaymentRequest, PaymentResponse, UpdatePaymentStatusRequest } from './payment.types';

export async function createPayment(
  data: CreatePaymentRequest,
  idempotencyKey?: string
): Promise<PaymentResponse> {
  const db = getAdminDbClient();

  const { data: result, error: rpcError } = await db.rpc('create_payment_transactional', {
    p_order_id: data.order_id,
    p_method: data.method,
    p_amount: data.amount,
    p_razorpay_order_id: data.razorpay_order_id || null,
    p_idempotency_key: idempotencyKey || null,
  });

  if (rpcError) {
    const errorMessage = rpcError.message || 'Unknown error';
    if (errorMessage.includes('already exists')) {
      throw new ConflictError(errorMessage);
    }
    throw new Error(`Failed to create payment: ${errorMessage}`);
  }

  const resultData = result as {
    success: boolean;
    payment_id: string;
    duplicate?: boolean;
  };

  if (resultData.duplicate) {
    const existingPayment = await findPaymentById(resultData.payment_id);
    if (!existingPayment) {
      throw new Error('Duplicate payment found but could not be retrieved');
    }
    return existingPayment;
  }

  const createdPayment = await findPaymentById(resultData.payment_id);
  if (!createdPayment) {
    throw new Error('Failed to retrieve created payment');
  }

  return createdPayment;
}

export async function findPaymentById(id: string): Promise<PaymentResponse | null> {
  const db = getAdminDbClient();

  const { data: payment, error } = await db
    .from('payments')
    .select(`
      *,
      payment_transactions (*)
    `)
    .eq('id', id)
    .single();

  if (error || !payment) {
    return null;
  }

  const paymentData = payment as any;
  return {
    ...paymentData,
    transactions: paymentData.payment_transactions || [],
  } as PaymentResponse;
}

export async function findPaymentByOrderId(orderId: string): Promise<PaymentResponse | null> {
  const db = getAdminDbClient();

  const { data: payment, error } = await db
    .from('payments')
    .select(`
      *,
      payment_transactions (*)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !payment) {
    return null;
  }

  const paymentData = payment as any;
  return {
    ...paymentData,
    transactions: paymentData.payment_transactions || [],
  } as PaymentResponse;
}

export async function updatePaymentStatus(
  paymentId: string,
  updateData: UpdatePaymentStatusRequest,
  orderStatus?: string,
  razorpayOrderId?: string
): Promise<PaymentResponse> {
  const db = getAdminDbClient();

  const { data: result, error: rpcError } = await db.rpc('update_payment_and_order_status', {
    p_payment_id: paymentId,
    p_payment_status: updateData.status,
    p_order_status: orderStatus || null,
    p_gateway_txn_id: updateData.gateway_txn_id || null,
    p_raw_response: updateData.raw_response ? (typeof updateData.raw_response === 'string' ? updateData.raw_response : JSON.stringify(updateData.raw_response)) : null,
    p_razorpay_order_id: razorpayOrderId || null,
  });

  if (rpcError) {
    throw new Error(`Failed to update payment status: ${rpcError.message || 'Unknown error'}`);
  }

  const resultData = result as {
    success: boolean;
    payment_id: string;
    order_id: string;
    payment_status: string;
    order_status: string;
  };

  return findPaymentById(resultData.payment_id) as Promise<PaymentResponse>;
}

export async function createPaymentTransaction(
  paymentId: string,
  gateway: string,
  gatewayTxnId: string,
  rawResponse?: any,
  status: string = 'pending'
): Promise<PaymentTransaction> {
  const db = getAdminDbClient();

  const { data: transaction, error } = await db
    .from('payment_transactions')
    .insert({
      payment_id: paymentId,
      gateway,
      gateway_txn_id: gatewayTxnId,
      raw_response: rawResponse || null,
      status,
    } as any)
    .select()
    .single();

  if (error || !transaction) {
    throw new Error(`Failed to create payment transaction: ${error?.message || 'Unknown error'}`);
  }

  return transaction as PaymentTransaction;
}



