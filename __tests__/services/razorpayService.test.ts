import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrder,
  refundPayment,
  verifyWebhookSignature,
  getRazorpayKeyId,
} from '@/services/razorpayService';
import { getSettings } from '@/modules/settings/settings.repository';
import Razorpay from 'razorpay';
import crypto from 'crypto';

jest.mock('razorpay');
jest.mock('@/modules/settings/settings.repository');

describe('Razorpay Service', () => {
  const mockRazorpayInstance = {
    orders: {
      create: jest.fn(),
      fetch: jest.fn(),
    },
    payments: {
      fetch: jest.fn(),
      refund: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Razorpay as jest.MockedClass<typeof Razorpay>).mockImplementation(() => mockRazorpayInstance as any);
    (getSettings as jest.Mock).mockResolvedValue({
      paymentMethods: {
        razorpay: {
          enabled: true,
          keyId: 'test_key_id',
          keySecret: 'test_key_secret',
          webhookSecret: 'test_webhook_secret',
        },
      },
    });
  });

  describe('createRazorpayOrder', () => {
    it('should create a Razorpay order successfully', async () => {
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
        status: 'created',
      };

      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder);

      const result = await createRazorpayOrder({
        amount: 10000,
        currency: 'INR',
        receipt: 'ORD-123',
        notes: { order_id: 'test-order-id' },
      });

      expect(result).toEqual(mockOrder);
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'INR',
        receipt: 'ORD-123',
        notes: { order_id: 'test-order-id' },
      });
    });

    it('should throw error when Razorpay API fails', async () => {
      mockRazorpayInstance.orders.create.mockRejectedValue(new Error('API Error'));

      await expect(
        createRazorpayOrder({
          amount: 10000,
          currency: 'INR',
        })
      ).rejects.toThrow('Failed to create Razorpay order');
    });

    it('should throw error when Razorpay is not configured', async () => {
      (getSettings as jest.Mock).mockResolvedValue({
        paymentMethods: {
          razorpay: {
            enabled: false,
          },
        },
      });

      await expect(
        createRazorpayOrder({
          amount: 10000,
          currency: 'INR',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyPaymentSignature', () => {
    it('should verify valid payment signature', async () => {
      const orderId = 'order_test123';
      const paymentId = 'pay_test123';
      const keySecret = 'test_key_secret';

      const text = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      const result = await verifyPaymentSignature({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: expectedSignature,
      });

      expect(result).toBe(true);
    });

    it('should reject invalid payment signature', async () => {
      const result = await verifyPaymentSignature({
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature',
      });

      expect(result).toBe(false);
    });

    it('should throw error when key secret is not configured', async () => {
      (getSettings as jest.Mock).mockResolvedValue({
        paymentMethods: {
          razorpay: {
            enabled: true,
            keyId: 'test_key_id',
          },
        },
      });

      await expect(
        verifyPaymentSignature({
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'signature',
        })
      ).rejects.toThrow('Razorpay key secret not configured');
    });
  });

  describe('fetchPayment', () => {
    it('should fetch payment details successfully', async () => {
      const mockPayment = {
        id: 'pay_test123',
        amount: 10000,
        status: 'captured',
      };

      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment);

      const result = await fetchPayment('pay_test123');

      expect(result).toEqual(mockPayment);
      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith('pay_test123');
    });

    it('should throw error when payment fetch fails', async () => {
      mockRazorpayInstance.payments.fetch.mockRejectedValue(new Error('Not found'));

      await expect(fetchPayment('invalid_id')).rejects.toThrow('Failed to fetch payment');
    });
  });

  describe('fetchOrder', () => {
    it('should fetch order details successfully', async () => {
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        status: 'paid',
      };

      mockRazorpayInstance.orders.fetch.mockResolvedValue(mockOrder);

      const result = await fetchOrder('order_test123');

      expect(result).toEqual(mockOrder);
      expect(mockRazorpayInstance.orders.fetch).toHaveBeenCalledWith('order_test123');
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const mockRefund = {
        id: 'rfnd_test123',
        amount: 5000,
        status: 'processed',
      };

      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRefund);

      const result = await refundPayment('pay_test123', 5000);

      expect(result).toEqual(mockRefund);
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_test123', {
        amount: 5000,
        notes: {},
      });
    });

    it('should process full refund when amount is not specified', async () => {
      const mockRefund = {
        id: 'rfnd_test123',
        amount: 10000,
        status: 'processed',
      };

      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRefund);

      const result = await refundPayment('pay_test123');

      expect(result).toEqual(mockRefund);
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_test123', {
        notes: {},
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"event":"payment.captured"}';
      const webhookSecret = 'test_webhook_secret';
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const result = verifyWebhookSignature(payload, expectedSignature, webhookSecret);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = '{"event":"payment.captured"}';
      const webhookSecret = 'test_webhook_secret';

      const result = verifyWebhookSignature(payload, 'invalid_signature', webhookSecret);

      expect(result).toBe(false);
    });
  });

  describe('getRazorpayKeyId', () => {
    it('should return key ID when configured', async () => {
      const result = await getRazorpayKeyId();

      expect(result).toBe('test_key_id');
    });

    it('should throw error when key ID is not configured', async () => {
      (getSettings as jest.Mock).mockResolvedValue({
        paymentMethods: {
          razorpay: {
            enabled: false,
          },
        },
      });

      await expect(getRazorpayKeyId()).rejects.toThrow('Razorpay key ID not configured');
    });
  });
});

