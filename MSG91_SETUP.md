# MSG91 WhatsApp/SMS OTP Setup

This guide explains how to set up MSG91 OTP Widget for WhatsApp/SMS authentication.

## Overview

We use the **MSG91 Widget API** instead of the direct OTP API. The Widget API:
- Supports multiple channels: SMS, WhatsApp, Email
- Has better reliability and error handling
- Requires a Widget ID from the MSG91 dashboard

## Required Environment Variables

Add these to your `.env.local`:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_authkey_here
MSG91_WIDGET_ID=your_widget_id_here
```

## Step-by-Step Setup

### 1. Get Your Auth Key

1. Login to MSG91 Dashboard: https://control.msg91.com/
2. Go to: **Settings** → **API** → **Authentication Key**
3. Copy your auth key

### 2. Create an OTP Widget

1. In MSG91 Dashboard, go to: **OTP** → **Widget**
2. Click **Create Widget**
3. Configure the widget:
   - **Name**: Your app name (e.g., "All in Cloth")
   - **OTP Length**: 6 digits (recommended)
   - **Expiry Time**: 5-10 minutes
   - **Channels**: Enable SMS and/or WhatsApp
   - **Template**: Use default or create custom
4. Click **Save**
5. Copy the **Widget ID**

### 3. Configure WhatsApp (Optional but Recommended)

If you want to send OTP via WhatsApp:

1. Go to: **WhatsApp** → **Setup**
2. Connect your WhatsApp Business account
3. Create an OTP template:
   - Go to: **WhatsApp** → **Templates**
   - Create a template with OTP placeholder: `{{1}}`
4. In your Widget settings, enable WhatsApp channel

### 4. Test the Integration

After setting up:

```bash
# Test sending OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999", "countryCode": "91"}'
```

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Body: { "phone": "9999999999", "countryCode": "91" }
Response: { "success": true, "data": { "otpRequired": true, "reqId": "xxx" } }
```

### Verify OTP
```
POST /api/auth/verify-otp
Body: { "phone": "9999999999", "countryCode": "91", "otp": "123456", "reqId": "xxx" }
Response: { "success": true, "data": { "user": {...} } }
```

### Forgot Password - Send OTP
```
POST /api/auth/forgot-password/send-otp
Body: { "phone": "9999999999", "countryCode": "91" }
Response: { "success": true, "data": { "reqId": "xxx" } }
```

### Forgot Password - Verify & Reset
```
POST /api/auth/forgot-password/verify-otp
Body: { "phone": "9999999999", "countryCode": "91", "otp": "123456", "reqId": "xxx", "newPassword": "newpass123" }
Response: { "success": true, "data": { "message": "Password reset successfully" } }
```

## Troubleshooting

### Error: "MSG91_WIDGET_ID not set"
- Create a widget in MSG91 Dashboard → OTP → Widget
- Copy the Widget ID and add to `.env.local`

### Error: "MSG91 Authentication Failed (401)"
1. Verify your auth key is correct
2. Ensure the widget is active
3. Check if your account is activated

### Error: "Widget not found"
1. Verify the Widget ID is correct
2. Ensure the widget is not deleted or disabled

### OTP Not Received
1. Check if the phone number format is correct (digits only)
2. Verify the SMS/WhatsApp channel is enabled in widget settings
3. Check MSG91 dashboard logs for delivery status

## Widget API Documentation

- Send OTP: https://docs.msg91.com/otp-widget/send-otp-1
- Verify OTP: https://docs.msg91.com/otp-widget/verify-otp
- Retry OTP: https://docs.msg91.com/otp-widget/retry-otp

## Files Modified

- `services/msg91Service.ts` - MSG91 Widget API integration
- `app/api/auth/send-otp/route.ts` - Send OTP endpoint
- `app/api/auth/verify-otp/route.ts` - Verify OTP endpoint
- `app/api/auth/forgot-password/send-otp/route.ts` - Forgot password send OTP
- `app/api/auth/forgot-password/verify-otp/route.ts` - Forgot password verify & reset
- `context/AuthContext.tsx` - Frontend auth context with reqId handling
- `app/login/page.tsx` - Login page with OTP flow
- `app/signup/page.tsx` - Signup page with OTP flow
- `app/forgot-password/page.tsx` - Forgot password page with OTP flow



