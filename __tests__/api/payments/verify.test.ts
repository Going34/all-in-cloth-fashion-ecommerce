import { POST } from '@/app/api/payments/verify/route';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyPayment } from '@/modules/payment/payment.service';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

jest.mock('@/lib/auth');
jest.mock('@/modules/payment/payment.service');

describe('POST /api/payments/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify payment successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockVerificationResult = {
      success: true,
      payment: {
        id: 'payment-123',
        status: 'completed',
      },
      order_status: 'paid',
    };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (verifyPayment as jest.Mock).mockResolvedValue(mockVerificationResult);

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
        razorpay_payment_id: 'rzp_pay_123',
        razorpay_signature: 'valid_signature',
      }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.success).toBe(true);
    expect(data.data.payment_status).toBe('completed');
    expect(data.data.order_status).toBe('paid');
  });

  it('should return 400 when required fields are missing', async () => {
    const mockUser = { id: 'user-123' };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
      }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('required');
  });

  it('should handle payment verification failure', async () => {
    const mockUser = { id: 'user-123' };
    const mockVerificationResult = {
      success: false,
      payment: {
        id: 'payment-123',
        status: 'failed',
      },
      order_status: 'pending',
    };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (verifyPayment as jest.Mock).mockResolvedValue(mockVerificationResult);

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
        razorpay_payment_id: 'rzp_pay_123',
        razorpay_signature: 'valid_signature',
      }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.success).toBe(false);
    expect(data.data.payment_status).toBe('failed');
  });

  it('should return 401 when user is not authenticated', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new UnauthorizedError());

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
        razorpay_payment_id: 'rzp_pay_123',
        razorpay_signature: 'valid_signature',
      }),
    }) as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should handle invalid signature error', async () => {
    const mockUser = { id: 'user-123' };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (verifyPayment as jest.Mock).mockRejectedValue(new ValidationError('Invalid payment signature'));

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
        razorpay_payment_id: 'rzp_pay_123',
        razorpay_signature: 'invalid_signature',
      }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 500 on internal database errors', async () => {
    const mockUser = { id: 'user-123' };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (verifyPayment as jest.Mock).mockRejectedValue(
      new Error('Failed to verify payment: column "updated_at" of relation "orders" does not exist')
    );

    const request = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: 'rzp_order_123',
        razorpay_payment_id: 'rzp_pay_123',
        razorpay_signature: 'valid_signature',
      }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('updated_at');
  });
});

