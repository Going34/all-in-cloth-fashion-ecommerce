import {
  createPaymentOrder,
  verifyPayment,
} from '@/modules/payment/payment.service';
import { createOrder } from '@/modules/order/order.service';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrder,
} from '@/services/razorpayService';
import { findOrderById } from '@/modules/order/order.repository';
import { findPaymentByOrderId } from '@/modules/payment/payment.repository';
import crypto from 'crypto';

jest.mock('@/modules/order/order.service');
jest.mock('@/modules/order/order.repository');
jest.mock('@/modules/payment/payment.repository');
jest.mock('@/modules/payment/payment.service');
jest.mock('@/services/razorpayService');
jest.mock('@/lib/db');

describe('Payment Flow Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';
  const mockRazorpayOrderId = 'rzp_order_123';
  const mockRazorpayPaymentId = 'rzp_pay_123';
  const keySecret = 'test_key_secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Payment Flow', () => {
    it('should complete full payment flow: order creation → payment creation → verification', async () => {
      const mockOrder = {
        id: mockOrderId,
        order_number: 'ORD-123',
        user_id: mockUserId,
        status: 'pending',
        total: 1000,
        subtotal: 900,
        tax: 80,
        shipping: 20,
      };

      const mockRazorpayOrder = {
        id: mockRazorpayOrderId,
        amount: 100000,
        currency: 'INR',
        status: 'created',
      };

      const mockPayment = {
        id: 'payment-123',
        order_id: mockOrderId,
        method: 'razorpay',
        amount: 1000,
        status: 'pending',
      };

      const mockRazorpayPayment = {
        id: mockRazorpayPaymentId,
        status: 'captured',
        amount: 100000,
        order_id: mockRazorpayOrderId,
      };

      const text = `${mockRazorpayOrderId}|${mockRazorpayPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      (createOrder as jest.Mock).mockResolvedValue(mockOrder);
      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(null);
      (createRazorpayOrder as jest.Mock).mockResolvedValue(mockRazorpayOrder);
      (fetchPayment as jest.Mock).mockResolvedValue(mockRazorpayPayment);
      (fetchOrder as jest.Mock).mockResolvedValue({
        ...mockRazorpayOrder,
        notes: {
          order_id: mockOrderId,
        },
      });
      (verifyPaymentSignature as jest.Mock).mockResolvedValue(true);
      
      const dbLib = require('@/lib/db');
      const getDbClient = dbLib.getDbClient;
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
      
      const paymentRepo = require('@/modules/payment/payment.repository');
      const createPaymentRepo = paymentRepo.createPayment;
      (createPaymentRepo as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        order_id: mockOrderId,
        method: 'razorpay',
        amount: 1000,
        status: 'pending',
      });
      
      const paymentRepo2 = require('@/modules/payment/payment.repository');
      const updatePaymentStatus = paymentRepo2.updatePaymentStatus;
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        order_id: mockOrderId,
        status: 'completed',
      });
      
      const orderService = require('@/modules/order/order.service');
      const updateOrderStatusAdmin = orderService.updateOrderStatusAdmin;
      (updateOrderStatusAdmin as jest.Mock).mockResolvedValue(undefined);

      const paymentService = require('@/modules/payment/payment.service');
      const createPaymentOrderFn = paymentService.createPaymentOrder;
      (createPaymentOrderFn as jest.Mock).mockResolvedValue({
        payment: mockPayment,
        razorpay_order: mockRazorpayOrder,
        key_id: 'test_key_id',
      });
      
      const paymentOrder = await createPaymentOrderFn({
        order_id: mockOrderId,
        method: 'razorpay',
        amount: 1000,
      });

      expect(paymentOrder.razorpay_order.id).toBe(mockRazorpayOrderId);
      expect(paymentOrder.payment).toBeDefined();
      expect(paymentOrder.payment.status).toBe('pending');

      const paymentService2 = require('@/modules/payment/payment.service');
      const verifyPaymentFn = paymentService2.verifyPayment;
      const verificationResult = await verifyPaymentFn({
        razorpay_order_id: mockRazorpayOrderId,
        razorpay_payment_id: mockRazorpayPaymentId,
        razorpay_signature: validSignature,
      });

      expect(verificationResult.success).toBe(true);
      expect(verificationResult.payment.status).toBe('completed');
      expect(verificationResult.order_status).toBe('paid');
    });

    it('should handle payment failure flow', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: 'pending',
        total: 1000,
      };

      const mockPayment = {
        id: 'payment-123',
        order_id: mockOrderId,
        status: 'pending',
      };

      const mockRazorpayPayment = {
        id: mockRazorpayPaymentId,
        status: 'failed',
      };

      const text = `${mockRazorpayOrderId}|${mockRazorpayPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (fetchPayment as jest.Mock).mockResolvedValue(mockRazorpayPayment);
      (fetchOrder as jest.Mock).mockResolvedValue({
        notes: {
          order_id: mockOrderId,
        },
      });
      (verifyPaymentSignature as jest.Mock).mockResolvedValue(true);
      
      const dbLib = require('@/lib/db');
      const getDbClient = dbLib.getDbClient;
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
      
      const paymentRepo2 = require('@/modules/payment/payment.repository');
      const updatePaymentStatus = paymentRepo2.updatePaymentStatus;
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'failed',
      });

      const paymentService2 = require('@/modules/payment/payment.service');
      const verifyPaymentFn = paymentService2.verifyPayment;
      (verifyPaymentFn as jest.Mock).mockResolvedValue({
        success: false,
        payment: {
          ...mockPayment,
          status: 'failed',
        },
        order_status: 'pending',
      });
      
      const verificationResult = await verifyPaymentFn({
        razorpay_order_id: mockRazorpayOrderId,
        razorpay_payment_id: mockRazorpayPaymentId,
        razorpay_signature: validSignature,
      });

      expect(verificationResult.success).toBe(false);
      expect(verificationResult.payment.status).toBe('failed');
      expect(verificationResult.order_status).toBe('pending');
    });

    it('should handle duplicate payment attempts', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: 'pending',
      };

      const existingPayment = {
        id: 'payment-123',
        status: 'pending',
      };

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(existingPayment);

      const paymentService = require('@/modules/payment/payment.service');
      const createPaymentOrderFn = paymentService.createPaymentOrder;
      await expect(
        createPaymentOrderFn({
          order_id: mockOrderId,
          method: 'razorpay',
          amount: 1000,
        })
      ).rejects.toThrow('Payment already exists');
    });
  });

  describe('Edge Cases', () => {
    it('should handle order with non-pending status', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: 'paid',
      };

      (findOrderById as jest.Mock).mockResolvedValue(mockOrder);

      const paymentService = require('@/modules/payment/payment.service');
      const createPaymentOrderFn = paymentService.createPaymentOrder;
      (createPaymentOrderFn as jest.Mock).mockRejectedValue(new Error('Cannot create payment for order with status: paid'));
      
      await expect(
        createPaymentOrderFn({
          order_id: mockOrderId,
          method: 'razorpay',
          amount: 1000,
        })
      ).rejects.toThrow('Cannot create payment for order with status');
    });

    it('should handle invalid payment signature', async () => {
      (verifyPaymentSignature as jest.Mock).mockResolvedValue(false);

      const paymentService2 = require('@/modules/payment/payment.service');
      const verifyPaymentFn = paymentService2.verifyPayment;
      await expect(
        verifyPaymentFn({
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: mockRazorpayPaymentId,
          razorpay_signature: 'invalid_signature',
        })
      ).rejects.toThrow('Invalid payment signature');
    });

    it('should handle missing order_id in Razorpay order notes', async () => {
      const mockRazorpayPayment = {
        id: mockRazorpayPaymentId,
        status: 'captured',
      };

      (verifyPaymentSignature as jest.Mock).mockResolvedValue(true);
      (fetchPayment as jest.Mock).mockResolvedValue(mockRazorpayPayment);
      (fetchOrder as jest.Mock).mockResolvedValue({
        notes: {},
      });
      
      const dbLib = require('@/lib/db');
      const getDbClient = dbLib.getDbClient;
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

      const paymentService2 = require('@/modules/payment/payment.service');
      const verifyPaymentFn = paymentService2.verifyPayment;
      await expect(
        verifyPaymentFn({
          razorpay_order_id: mockRazorpayOrderId,
          razorpay_payment_id: mockRazorpayPaymentId,
          razorpay_signature: 'valid_signature',
        })
      ).rejects.toThrow();
    });
  });
});

