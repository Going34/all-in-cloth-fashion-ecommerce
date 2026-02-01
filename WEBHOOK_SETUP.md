# MSG91 Webhook Setup Guide

This guide explains how to set up and use the MSG91 webhook for number verification events.

## Overview

The webhook endpoint receives POST requests from MSG91 when OTP events occur (OTP sent, verified, failed, etc.). The webhook automatically updates user phone verification status in the database.

## Webhook Endpoint

**URL:** `POST /api/webhooks/msg91`

**Security:** Requires `x-api-key` header for authentication

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# Webhook API Key (generate a secure random string)
WEBHOOK_API_KEY=your_secure_random_api_key_here
```

**Generate a secure API key:**
```bash
# Using openssl
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure MSG91 Webhook

1. Login to MSG91 Dashboard: https://control.msg91.com/
2. Go to: **OTP** → **Widget** → Select your widget
3. Navigate to **Webhook** section
4. Configure webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/msg91`
   - **Method**: `POST`
   - **Headers**: 
     - Key: `x-api-key`
     - Value: Your `WEBHOOK_API_KEY` from `.env.local`
5. Enable events you want to receive:
   - OTP Sent
   - OTP Verified
   - OTP Failed
   - Verification Complete
   - Verification Failed
6. Click **Save**

### 3. Test the Webhook

#### Test using cURL:

```bash
curl -X POST http://localhost:3000/api/webhooks/msg91 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_webhook_api_key" \
  -d '{
    "type": "otp_verified",
    "reqId": "test_req_id_123",
    "identifier": "919999999999",
    "status": "success",
    "message": "OTP verified successfully"
  }'
```

#### Test using the WebhookContext:

```tsx
import { useWebhook, useWebhookSimulator } from '@/context/WebhookContext';

function TestComponent() {
  const { setApiKey, startListening, events } = useWebhook();
  const { simulateEvent } = useWebhookSimulator();

  const handleTest = async () => {
    // Set your API key
    setApiKey('your_webhook_api_key');
    
    // Simulate a webhook event
    await simulateEvent({
      type: 'otp_verified',
      reqId: 'test_123',
      phone: '+919999999999',
      status: 'success',
    });
  };

  return (
    <div>
      <button onClick={handleTest}>Test Webhook</button>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}
```

## Webhook Event Types

The webhook handles the following event types:

| Event Type | Description | Action |
|------------|-------------|--------|
| `otp_sent` | OTP has been sent to user | Logged |
| `otp_verified` | OTP verified successfully | Updates `is_phone_verified = true` |
| `otp_failed` | OTP verification failed | Logged |
| `verification_complete` | Number verification completed | Updates `is_phone_verified = true` |
| `verification_failed` | Number verification failed | Logged |

## Webhook Payload Format

### Expected Payload Structure:

```json
{
  "type": "otp_verified",
  "reqId": "request-id-from-msg91",
  "identifier": "919999999999",
  "phone": "+919999999999",
  "countryCode": "91",
  "status": "success",
  "message": "OTP verified successfully",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "error": "Error message if failed",
  "useraccess": "Token from MSG91"
}
```

### Field Descriptions:

- `type` (required): Event type (`otp_sent`, `otp_verified`, `otp_failed`, etc.)
- `reqId` (optional): Request ID from MSG91
- `identifier` (optional): Phone number in MSG91 format (e.g., "919999999999")
- `phone` (optional): Phone number in E.164 format (e.g., "+919999999999")
- `status` (optional): Event status (`success`, `failed`, `pending`)
- `message` (optional): Human-readable message
- `timestamp` (optional): ISO timestamp
- `error` (optional): Error message if event failed
- `useraccess` (optional): Access token from MSG91

## Response Format

### Success Response (200 OK):

```json
{
  "success": true,
  "data": {
    "received": true,
    "eventType": "otp_verified",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Responses:

**401 Unauthorized** (Missing or invalid API key):
```json
{
  "success": false,
  "error": {
    "message": "Invalid or missing x-api-key header"
  }
}
```

**400 Bad Request** (Invalid payload):
```json
{
  "success": false,
  "error": {
    "message": "Invalid webhook payload format"
  }
}
```

## Using WebhookContext

The `WebhookContext` provides React hooks for managing webhook state:

### Basic Usage:

```tsx
import { useWebhook } from '@/context/WebhookContext';

function WebhookMonitor() {
  const {
    events,
    latestEvent,
    isListening,
    isLoading,
    error,
    startListening,
    stopListening,
    clearEvents,
    getEventsByType,
    getEventsByPhone,
    webhookUrl,
    apiKey,
    setApiKey,
  } = useWebhook();

  return (
    <div>
      <h2>Webhook URL: {webhookUrl}</h2>
      <p>Status: {isListening ? 'Listening' : 'Stopped'}</p>
      <p>Latest Event: {latestEvent?.type}</p>
      <button onClick={startListening}>Start Listening</button>
      <button onClick={stopListening}>Stop Listening</button>
      <button onClick={clearEvents}>Clear Events</button>
      
      <div>
        <h3>Events ({events.length})</h3>
        {events.map((event) => (
          <div key={event.id}>
            <strong>{event.type}</strong> - {event.status} - {event.timestamp}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Filter Events:

```tsx
// Get all verified events
const verifiedEvents = getEventsByType('otp_verified');

// Get all events for a specific phone number
const phoneEvents = getEventsByPhone('+919999999999');
```

## Security Best Practices

1. **Use a strong API key**: Generate a random, secure API key (at least 32 characters)
2. **Keep API key secret**: Never commit `WEBHOOK_API_KEY` to version control
3. **Use HTTPS**: Always use HTTPS in production for webhook URLs
4. **Validate payloads**: The webhook validates all incoming payloads
5. **Rate limiting**: Consider adding rate limiting for production use
6. **IP whitelisting**: Optionally whitelist MSG91 IP addresses (check MSG91 documentation)

## Troubleshooting

### Webhook not receiving events

1. **Check API key**: Verify `WEBHOOK_API_KEY` matches in both `.env.local` and MSG91 dashboard
2. **Check URL**: Ensure webhook URL is correct and accessible
3. **Check logs**: Review server logs for webhook errors
4. **Test manually**: Use cURL to test the webhook endpoint

### Events not updating user verification

1. **Check phone format**: Ensure phone number format matches database format (E.164)
2. **Check database**: Verify user exists with matching phone number
3. **Check logs**: Review webhook processing logs for errors

### 401 Unauthorized Error

- Verify `x-api-key` header is included in request
- Verify `WEBHOOK_API_KEY` environment variable is set
- Verify API key matches between MSG91 dashboard and `.env.local`

## Files Modified

- `app/api/webhooks/msg91/route.ts` - Webhook endpoint with x-api-key authentication
- `context/WebhookContext.tsx` - React context for webhook state management
- `app/providers.tsx` - Added WebhookProvider to app providers

## Next Steps

1. Set `WEBHOOK_API_KEY` in your `.env.local`
2. Configure webhook URL in MSG91 dashboard
3. Test webhook using cURL or the WebhookContext
4. Monitor webhook events in your application
5. Verify user phone verification status updates correctly

