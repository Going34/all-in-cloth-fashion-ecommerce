import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/response';
import { getAdminDbClient } from '@/lib/adminDb';

/**
 * MSG91 Webhook Event Types
 * Based on MSG91 webhook documentation
 */
interface Msg91WebhookEvent {
  type: 'otp_sent' | 'otp_verified' | 'otp_failed' | 'verification_complete' | 'verification_failed';
  reqId?: string;
  identifier?: string; // Phone number in MSG91 format (e.g., "919999999999")
  phone?: string; // Phone number
  countryCode?: string;
  status?: 'success' | 'failed' | 'pending';
  message?: string;
  timestamp?: string;
  error?: string;
  useraccess?: string; // Token from MSG91 after successful verification
}

/**
 * Validate x-api-key header
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.WEBHOOK_API_KEY;

  if (!expectedApiKey) {
    console.warn('[Webhook] WEBHOOK_API_KEY not set in environment variables');
    return false;
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn('[Webhook] Invalid or missing x-api-key header');
    return false;
  }

  return true;
}

/**
 * Parse and validate webhook payload
 */
function parseWebhookPayload(body: unknown): Msg91WebhookEvent | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const payload = body as Record<string, unknown>;

  // MSG91 webhook format can vary, so we handle multiple possible structures
  const event: Msg91WebhookEvent = {
    type: (payload.type as Msg91WebhookEvent['type']) || 
          (payload.event as Msg91WebhookEvent['type']) || 
          'otp_sent',
    reqId: payload.reqId as string | undefined,
    identifier: payload.identifier as string | undefined || 
                payload.phone as string | undefined,
    phone: payload.phone as string | undefined,
    countryCode: payload.countryCode as string | undefined,
    status: (payload.status as Msg91WebhookEvent['status']) || 
            (payload.type === 'otp_verified' || payload.type === 'verification_complete' ? 'success' : 'pending'),
    message: payload.message as string | undefined,
    timestamp: payload.timestamp as string | undefined || new Date().toISOString(),
    error: payload.error as string | undefined,
    useraccess: payload.useraccess as string | undefined,
  };

  return event;
}

/**
 * Handle webhook event - update user verification status
 */
async function handleWebhookEvent(event: Msg91WebhookEvent): Promise<void> {
  const db = getAdminDbClient();

  // Extract phone number from identifier if needed
  let phoneNumber: string | null = null;
  
  if (event.phone) {
    phoneNumber = event.phone;
  } else if (event.identifier) {
    // MSG91 format: countryCode + phoneNumber (e.g., "919999999999")
    // Convert to E.164 format: +919999999999
    const identifier = event.identifier.replace(/\D/g, '');
    if (identifier.length >= 10) {
      phoneNumber = `+${identifier}`;
    }
  }

  if (!phoneNumber) {
    console.warn('[Webhook] No phone number found in event:', event);
    return;
  }

  console.log('[Webhook] Processing event:', {
    type: event.type,
    phone: phoneNumber.substring(0, 5) + '***',
    status: event.status,
  });

  // Handle different event types
  switch (event.type) {
    case 'otp_verified':
    case 'verification_complete':
      // Update user's phone verification status
      if (event.status === 'success') {
        const { error: updateError } = await db
          .from('users')
          .update({
            is_phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('phone', phoneNumber);

        if (updateError) {
          console.error('[Webhook] Error updating user verification:', updateError);
          throw updateError;
        }

        console.log('[Webhook] Phone number verified successfully:', phoneNumber.substring(0, 5) + '***');
      }
      break;

    case 'otp_failed':
    case 'verification_failed':
      // Log failed verification attempts
      console.warn('[Webhook] Verification failed:', {
        phone: phoneNumber.substring(0, 5) + '***',
        error: event.error || event.message,
      });
      break;

    case 'otp_sent':
      // Log OTP sent event
      console.log('[Webhook] OTP sent:', phoneNumber.substring(0, 5) + '***');
      break;

    default:
      console.log('[Webhook] Unhandled event type:', event.type);
  }
}

/**
 * POST /api/webhooks/msg91
 * 
 * Webhook endpoint for MSG91 number verification events
 * 
 * Security:
 * - Requires x-api-key header matching WEBHOOK_API_KEY env var
 * 
 * Expected Headers:
 * - x-api-key: Your webhook API key
 * 
 * Expected Body (MSG91 Webhook Format):
 * {
 *   "type": "otp_verified" | "otp_sent" | "otp_failed" | "verification_complete" | "verification_failed",
 *   "reqId": "request-id-from-msg91",
 *   "identifier": "919999999999" | "phone": "+919999999999",
 *   "status": "success" | "failed" | "pending",
 *   "message": "Optional message",
 *   "timestamp": "ISO timestamp",
 *   "error": "Error message if failed",
 *   "useraccess": "Token from MSG91"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse(
        new Error('Invalid or missing x-api-key header'),
        401
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse(
        new Error('Invalid JSON payload'),
        400
      );
    }

    // Parse and validate webhook event
    const event = parseWebhookPayload(body);
    if (!event) {
      return errorResponse(
        new Error('Invalid webhook payload format'),
        400
      );
    }

    // Handle the webhook event
    await handleWebhookEvent(event);

    // Return success response (MSG91 expects 200 OK)
    return successResponse({
      received: true,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    }, 200);

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return errorResponse(error, 500);
  }
}

/**
 * GET /api/webhooks/msg91
 * 
 * Health check endpoint for webhook
 */
export async function GET() {
  return successResponse({
    status: 'active',
    endpoint: '/api/webhooks/msg91',
    method: 'POST',
    requiresAuth: true,
    authHeader: 'x-api-key',
  });
}

