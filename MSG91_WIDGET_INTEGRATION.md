# MSG91 OTP Widget Integration Guide

This guide explains how to integrate the MSG91 OTP Widget for client-side OTP verification with server-side token validation.

## Overview

The MSG91 OTP Widget provides a pre-built UI for OTP verification. After successful verification, the widget returns a JWT access token that must be verified on the server to authenticate the user.

## Features

- ✅ Client-side OTP widget integration
- ✅ Server-side access token verification
- ✅ Automatic user creation/authentication
- ✅ React hooks and components for easy integration
- ✅ TypeScript support

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# MSG91 Configuration
MSG91_AUTH_KEY=your_authkey_here
MSG91_WIDGET_ID=your_widget_id_here

# Optional: For client-side widget
NEXT_PUBLIC_MSG91_WIDGET_ID=your_widget_id_here
```

### 2. Get Widget ID

1. Login to MSG91 Dashboard: https://control.msg91.com/
2. Go to: **OTP** → **Widget**
3. Copy your Widget ID

## Integration Methods

### Method 1: Using the React Component (Recommended)

The easiest way to integrate the widget:

```tsx
'use client';

import Msg91Widget from '@/components/Msg91Widget';
import { useRouter } from 'next/navigation';

export default function LoginWithWidget() {
  const router = useRouter();

  return (
    <div>
      <h1>Login with OTP</h1>
      <Msg91Widget
        widgetId={process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!}
        exposeMethods={true}
        autoVerifyToken={true}
        onSuccess={(data) => {
          console.log('OTP verified:', data);
        }}
        onTokenVerified={(user) => {
          console.log('User authenticated:', user);
          router.push('/dashboard');
        }}
        onError={(error) => {
          console.error('Error:', error);
        }}
      />
    </div>
  );
}
```

### Method 2: Using the Hook

For more control, use the `useMsg91Widget` hook:

```tsx
'use client';

import { useMsg91Widget } from '@/hooks/useMsg91Widget';
import { useEffect } from 'react';

export default function LoginWithHook() {
  const { initWidget, verifyAccessToken, isLoading, error } = useMsg91Widget();
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!;

  useEffect(() => {
    initWidget({
      widgetId,
      exposeMethods: true,
      // Optional: pre-fill phone number
      identifier: '+919999999999',
    });
  }, [widgetId, initWidget]);

  // Handle widget success (this will be called by the widget)
  useEffect(() => {
    // We need to wrap the widget initialization with our callback
    if (typeof window !== 'undefined' && window.initSendOTP) {
      const originalInit = window.initSendOTP;
      window.initSendOTP = (config: any) => {
        originalInit({
          ...config,
          success: async (data: { token?: string }) => {
            if (data.token) {
              const result = await verifyAccessToken(data.token);
              if (!result.error) {
                // User authenticated successfully
                window.location.href = '/dashboard';
              }
            }
          },
        });
      };
    }
  }, [verifyAccessToken]);

  return (
    <div>
      <h1>Login with OTP</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <div id="msg91-otp-widget"></div>
    </div>
  );
}
```

### Method 3: Direct Script Integration

For vanilla JavaScript or custom implementations:

```tsx
'use client';

import { useEffect } from 'react';

export default function LoginDirect() {
  useEffect(() => {
    // Load MSG91 script
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.initSendOTP === 'function') {
        const configuration = {
          widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!,
          exposeMethods: true,
          success: async (data: { token?: string }) => {
            // Verify token on server
            const response = await fetch('/api/auth/verify-widget-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: data.token }),
            });

            const result = await response.json();
            if (result.success) {
              window.location.href = '/dashboard';
            }
          },
          failure: (error: any) => {
            console.error('Widget error:', error);
          },
        };

        window.initSendOTP(configuration);
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scriptElement = document.querySelector('script[src*="otp-provider.js"]');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  return (
    <div>
      <h1>Login with OTP</h1>
      <div id="msg91-otp-widget"></div>
    </div>
  );
}
```

## API Endpoints

### Verify Widget Token

**Endpoint:** `POST /api/auth/verify-widget-token`

**Request Body:**
```json
{
  "accessToken": "jwt_token_from_widget",
  "name": "Optional user name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "user": {
      "id": "user-uuid",
      "phone": "+919999999999",
      "name": "User Name",
      "is_phone_verified": true,
      "roles": ["USER"]
    },
    "verified": true,
    "identifier": "919999999999"
  }
}
```

## Widget Configuration Options

### Basic Configuration

```typescript
const configuration = {
  widgetId: "your_widget_id",           // Required
  tokenAuth: "optional_token",          // Optional authentication token
  identifier: "+919999999999",          // Optional: pre-fill phone/email
  exposeMethods: true,                  // Optional: expose sendOtp/verifyOtp methods
  body_1: "Custom body text",           // Optional: custom message
  success: (data) => {                  // Required: success callback
    console.log('Success:', data);
  },
  failure: (error) => {                 // Required: failure callback
    console.error('Error:', error);
  }
};
```

### Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `widgetId` | string | Yes | Your MSG91 Widget ID |
| `tokenAuth` | string | No | Optional authentication token |
| `identifier` | string | No | Pre-fill phone number or email |
| `exposeMethods` | boolean | No | Enable `sendOtp()` and `verifyOtp()` methods |
| `body_1` | string | No | Custom body text for OTP message |
| `success` | function | Yes | Callback when OTP is verified |
| `failure` | function | Yes | Callback when verification fails |

### Success Callback Data

```typescript
{
  token: string;              // JWT access token (verify on server)
  identifier?: string;        // Verified phone/email
  phone?: string;             // Phone number if verified
  email?: string;             // Email if verified
}
```

## Using Widget Methods (exposeMethods: true)

When `exposeMethods: true`, you can programmatically control the widget:

```typescript
// Send OTP
window.sendOtp('+919999999999');

// Verify OTP
window.verifyOtp('123456');
```

## Server-Side Verification

The access token from the widget must be verified on your server:

```typescript
// services/msg91Service.ts
import { verifyAccessToken } from '@/services/msg91Service';

const result = await verifyAccessToken({
  accessToken: 'jwt_token_from_widget'
});

// Returns:
// {
//   type: 'success',
//   identifier: '919999999999',
//   phone: '+919999999999',
//   verified: true
// }
```

## Example: Complete Login Flow

```tsx
'use client';

import { useState, useEffect } from 'react';
import Msg91Widget from '@/components/Msg91Widget';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        <Msg91Widget
          widgetId={process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!}
          exposeMethods={true}
          autoVerifyToken={true}
          onTokenVerified={(user) => {
            setUser(user);
            router.push('/dashboard');
          }}
          onError={(error) => {
            alert(`Error: ${error.message}`);
          }}
        />
      </div>
    </div>
  );
}
```

## Troubleshooting

### Widget not loading

1. Check widget ID is correct
2. Verify script URLs are accessible
3. Check browser console for errors
4. Ensure widget is active in MSG91 dashboard

### Token verification fails

1. Verify `MSG91_AUTH_KEY` is correct
2. Check token is not expired
3. Ensure token format is correct (JWT)
4. Check server logs for detailed errors

### User not created/authenticated

1. Check database connection
2. Verify user creation logic in `/api/auth/verify-widget-token`
3. Check JWT session token generation
4. Verify session cookie is set correctly

## Security Notes

1. **Never expose `MSG91_AUTH_KEY` to client** - It should only be used server-side
2. **Always verify access tokens** - Never trust client-provided tokens without verification
3. **Use HTTPS** - Always use HTTPS in production
4. **Validate tokens server-side** - Token verification must happen on your server

## Files Created/Modified

- `services/msg91Service.ts` - Added `verifyAccessToken()` function
- `app/api/auth/verify-widget-token/route.ts` - Server endpoint for token verification
- `hooks/useMsg91Widget.ts` - React hook for widget integration
- `components/Msg91Widget.tsx` - Ready-to-use React component
- `MSG91_WIDGET_INTEGRATION.md` - This documentation

## Next Steps

1. Set `NEXT_PUBLIC_MSG91_WIDGET_ID` in your environment
2. Add the widget component to your login page
3. Test the OTP flow
4. Customize the widget styling if needed
5. Handle success/error states in your application

