import type { Payment, PaymentStatus, PaymentTransaction } from '@/types';

export interface CreatePaymentRequest {
  order_id: string;
  method: string;
  amount: number;
  razorpay_order_id?: string;
}

export interface PaymentResponse extends Payment {
  transactions?: PaymentTransaction[];
}

export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
  gateway_txn_id?: string;
  raw_response?: any;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  payment: PaymentResponse;
  order_status: string;
}









