import {
  createPaymentOrder,
  verifyPayment,
  getPayment,
  getPaymentByOrderId,
} from '@/modules/payment/payment.service';
import {
  createPayment as createPaymentRepo,
  findPaymentById,
  findPaymentByOrderId,
  updatePaymentStatus,
} from '@/modules/payment/payment.repository';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrder,
  getRazorpayKeyId,
} from '@/services/razorpayService';
import { findOrderById } from '@/modules/order/order.repository';
import { updateOrderStatusAdmin } from '@/modules/order/order.service';

jest.mock('@/modules/payment/payment.repository');
jest.mock('@/services/razorpayService');
jest.mock('@/modules/order/order.repository');
jest.mock('@/modules/order/order.service');
jest.mock('@/lib/db');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentOrder', () => {
    it('should create payment order successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        order_number: 'ORD-123',
        user_id: 'user-123',
        status: 'pending',
        total: 1000,
      };

      const mockRazorpayOrder = {
        id: 'rzp_order_123',
        amount: 100000,
        currency: 'INR',
      };

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        method: 'razorpay',
        amount: 1000,
        status: 'pending',
      };

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(null);
      (createRazorpayOrder as jest.Mock).mockResolvedValue(mockRazorpayOrder);
      (createPaymentRepo as jest.Mock).mockResolvedValue(mockPayment);
      (getRazorpayKeyId as jest.Mock).mockResolvedValue('test_key_id');

      const result = await createPaymentOrder({
        order_id: 'order-123',
        method: 'razorpay',
        amount: 1000,
      });

      expect(result).toHaveProperty('payment');
      expect(result).toHaveProperty('razorpay_order');
      expect(result).toHaveProperty('key_id');
      expect(result.key_id).toBe('test_key_id');
      expect(createRazorpayOrder).toHaveBeenCalledWith({
        amount: 100000,
        currency: 'INR',
        receipt: 'ORD-123',
        notes: {
          order_id: 'order-123',
          order_number: 'ORD-123',
        },
        customer: {
          name: 'user-123',
        },
      });
    });

    it('should throw error when order not found', async () => {
      (findOrderById as jest.Mock).mockResolvedValue(null);

      await expect(
        createPaymentOrder({
          order_id: 'invalid-order',
          method: 'razorpay',
          amount: 1000,
        })
      ).rejects.toThrow('Order');
    });

    it('should throw error when order status is not pending', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'paid',
      };

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        createPaymentOrder({
          order_id: 'order-123',
          method: 'razorpay',
          amount: 1000,
        })
      ).rejects.toThrow('Cannot create payment for order with status');
    });

    it('should throw error when payment already exists', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'pending',
      };

      const mockExistingPayment = {
        id: 'payment-123',
        status: 'pending',
      };

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockExistingPayment);

      await expect(
        createPaymentOrder({
          order_id: 'order-123',
          method: 'razorpay',
          amount: 1000,
        })
      ).rejects.toThrow('Payment already exists');
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully and update order status', async () => {
      const mockRazorpayPayment = {
        id: 'pay_123',
        status: 'captured',
        amount: 10000,
      };

      const mockRazorpayOrder = {
        id: 'order_123',
        notes: {
          order_id: 'order-123',
        },
      };

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'completed',
      };

      (verifyPaymentSignature as jest.Mock).mockResolvedValue(true);
      (fetchPayment as jest.Mock).mockResolvedValue(mockRazorpayPayment);
      (fetchOrder as jest.Mock).mockResolvedValue(mockRazorpayOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (updatePaymentStatus as jest.Mock).mockResolvedValue(mockUpdatedPayment);
      (updateOrderStatusAdmin as jest.Mock).mockResolvedValue(undefined);
      
      const { getDbClient } = require('@/lib/db');
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      };
      (getDbClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await verifyPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature',
      });

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('completed');
      expect(result.order_status).toBe('paid');
      expect(updateOrderStatusAdmin).toHaveBeenCalledWith('order-123', 'paid');
    });

    it('should fail verification with invalid signature', async () => {
      (verifyPaymentSignature as jest.Mock).mockResolvedValue(false);

      await expect(
        verifyPayment({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_signature',
        })
      ).rejects.toThrow('Invalid payment signature');
    });

    it('should mark payment as failed when Razorpay payment status is not captured', async () => {
      const mockRazorpayPayment = {
        id: 'pay_123',
        status: 'failed',
      };

      const mockRazorpayOrder = {
        id: 'order_123',
        notes: {
          order_id: 'order-123',
        },
      };

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        status: 'pending',
      };

      (verifyPaymentSignature as jest.Mock).mockResolvedValue(true);
      (fetchPayment as jest.Mock).mockResolvedValue(mockRazorpayPayment);
      (fetchOrder as jest.Mock).mockResolvedValue(mockRazorpayOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'failed',
      });
      
      const { getDbClient } = require('@/lib/db');
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      };
      (getDbClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await verifyPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature',
      });

      expect(result.success).toBe(false);
      expect(result.payment.status).toBe('failed');
      expect(result.order_status).toBe('pending');
    });
  });

  describe('getPayment', () => {
    it('should return payment by ID', async () => {
      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        amount: 1000,
      };

      (findPaymentById as jest.Mock).mockResolvedValue(mockPayment);

      const result = await getPayment('payment-123');

      expect(result).toEqual(mockPayment);
      expect(findPaymentById).toHaveBeenCalledWith('payment-123');
    });

    it('should throw error when payment not found', async () => {
      (findPaymentById as jest.Mock).mockResolvedValue(null);

      await expect(getPayment('invalid-id')).rejects.toThrow('Payment');
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return payment by order ID', async () => {
      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
      };

      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);

      const result = await getPaymentByOrderId('order-123');

      expect(result).toEqual(mockPayment);
    });

    it('should return null when payment not found', async () => {
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(null);

      const result = await getPaymentByOrderId('order-123');

      expect(result).toBeNull();
    });
  });
});

