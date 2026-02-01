import { POST } from '@/app/api/webhooks/razorpay/route';
import { NextRequest } from 'next/server';
import { verifyWebhookSignature } from '@/services/razorpayService';
import { getSettings } from '@/modules/settings/settings.repository';
import { findPaymentByOrderId, updatePaymentStatus } from '@/modules/payment/payment.repository';
import crypto from 'crypto';

jest.mock('@/services/razorpayService');
jest.mock('@/modules/settings/settings.repository');
jest.mock('@/modules/payment/payment.repository');

describe('POST /api/webhooks/razorpay', () => {
  const webhookSecret = 'test_webhook_secret';

  beforeEach(() => {
    jest.clearAllMocks();
    (getSettings as jest.Mock).mockResolvedValue({
      paymentMethods: {
        razorpay: {
          webhookSecret,
        },
      },
    });
  });

  const createWebhookRequest = (payload: unknown, signature?: string) => {
    const payloadString = JSON.stringify(payload);
    const headers = new Headers();
    if (signature) {
      headers.set('x-razorpay-signature', signature);
    }

    return new Request('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers,
      body: payloadString,
    }) as NextRequest;
  };

  describe('payment.captured event', () => {
    it('should handle payment.captured event successfully', async () => {
      const payload = {
        entity: 'event',
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000,
              status: 'captured',
              notes: {
                order_id: 'order-123',
              },
            },
          },
        },
      };

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        status: 'pending',
      };

      (verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });

      const request = createWebhookRequest(payload, signature);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.received).toBe(true);
      expect(data.data.event).toBe('payment.captured');
      expect(updatePaymentStatus).toHaveBeenCalled();
    });
  });

  describe('payment.failed event', () => {
    it('should handle payment.failed event successfully', async () => {
      const payload = {
        entity: 'event',
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              amount: 10000,
              status: 'failed',
              notes: {
                order_id: 'order-123',
              },
            },
          },
        },
      };

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        status: 'pending',
      };

      (verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'failed',
      });

      const request = createWebhookRequest(payload, signature);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updatePaymentStatus).toHaveBeenCalledWith(
        'payment-123',
        expect.objectContaining({
          status: 'failed',
        }),
        'cancelled',
        undefined
      );
    });
  });

  describe('order.paid event', () => {
    it('should handle order.paid event successfully', async () => {
      const payload = {
        entity: 'event',
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: 'order_123',
              amount: 10000,
              notes: {
                order_id: 'order-123',
              },
            },
          },
        },
      };

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const mockPayment = {
        id: 'payment-123',
        order_id: 'order-123',
        status: 'pending',
      };

      (verifyWebhookSignature as jest.Mock).mockReturnValue(true);
      (findPaymentByOrderId as jest.Mock).mockResolvedValue(mockPayment);
      (updatePaymentStatus as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });

      const request = createWebhookRequest(payload, signature);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updatePaymentStatus).toHaveBeenCalled();
    });
  });

  it('should return 401 when signature is invalid', async () => {
    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {},
    };

    (verifyWebhookSignature as jest.Mock).mockReturnValue(false);

    const request = createWebhookRequest(payload, 'invalid_signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should handle missing signature gracefully when webhook secret is not configured', async () => {
    (getSettings as jest.Mock).mockResolvedValue({
      paymentMethods: {
        razorpay: {},
      },
    });

    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {},
    };

    (verifyWebhookSignature as jest.Mock).mockReturnValue(true);

    const request = createWebhookRequest(payload);
    const response = await POST(request);

    // Handler requires signature if webhook secret exists in settings; if missing, it's 401
    expect(response.status).toBe(401);
  });

  it('should handle unhandled events gracefully', async () => {
    const payload = {
      entity: 'event',
      event: 'payment.authorized',
      payload: {},
    };

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    (verifyWebhookSignature as jest.Mock).mockReturnValue(true);

    const request = createWebhookRequest(payload, signature);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.received).toBe(true);
  });

  it('should handle missing order_id in payment notes', async () => {
    const payload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            notes: {},
          },
        },
      },
    };

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    (verifyWebhookSignature as jest.Mock).mockReturnValue(true);

    const request = createWebhookRequest(payload, signature);
    const response = await POST(request);

    // Missing order_id in notes throws -> 500
    expect(response.status).toBe(500);
  });
});

