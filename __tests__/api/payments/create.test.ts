import { POST } from '@/app/api/payments/create/route';
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createPaymentOrder } from '@/modules/payment/payment.service';
import { findOrderById } from '@/modules/order/order.repository';

jest.mock('@/lib/auth');
jest.mock('@/modules/payment/payment.service');
jest.mock('@/modules/order/order.repository');

describe('POST /api/payments/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create payment order successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockOrder = {
      id: 'order-123',
      user_id: 'user-123',
      total: 1000,
      order_number: 'ORD-123',
    };

    const mockPaymentResult = {
      payment: {
        id: 'payment-123',
        order_id: 'order-123',
        amount: 1000,
      },
      razorpay_order: {
        id: 'rzp_order_123',
        amount: 100000,
        currency: 'INR',
      },
      key_id: 'test_key_id',
    };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
    (createPaymentOrder as jest.Mock).mockResolvedValue(mockPaymentResult);

    const request = new Request('http://localhost/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 'order-123' }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('payment_id');
    expect(data.data).toHaveProperty('razorpay_order_id');
    expect(data.data).toHaveProperty('key_id');
    expect(data.data.amount).toBe(100000);
  });

  it('should return 400 when order_id is missing', async () => {
    const mockUser = { id: 'user-123' };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('order_id is required');
  });

  it('should return 404 when order not found', async () => {
    const mockUser = { id: 'user-123' };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (findOrderById as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 'invalid-order' }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return 403 when user does not own the order', async () => {
    const mockUser = { id: 'user-123' };
    const mockOrder = {
      id: 'order-123',
      user_id: 'different-user',
      total: 1000,
    };

    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
    (findOrderById as jest.Mock).mockResolvedValue(mockOrder);

    const request = new Request('http://localhost/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 'order-123' }),
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('should return 401 when user is not authenticated', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const request = new Request('http://localhost/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: 'order-123' }),
    }) as NextRequest;

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});

