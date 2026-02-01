# MSG91 "Access Token Unverified" - Fix Guide

## 🔴 Problem

In MSG91 Dashboard → OTP → Widget/SDK → Logs, you see:
- ✅ OTP sent successfully
- ✅ OTP verified by user
- ❌ **"Access token unverified"** status

## 🔍 What This Means

When using MSG91 OTP Widget:
1. User enters phone number → OTP is sent
2. User enters OTP → Widget verifies it
3. MSG91 returns an **access token** (JWT)
4. This token **must be verified on your server** to complete authentication
5. If token isn't verified, status shows "Access token unverified"

## ✅ Solution: Verify Access Token on Server

### Step 1: Ensure Widget Success Callback is Set Up

The widget must send the access token to your server after OTP verification.

**If using the Msg91Widget component:**

```tsx
<Msg91Widget
  widgetId={process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!}
  autoVerifyToken={true}  // ✅ This automatically verifies the token
  onTokenVerified={(user) => {
    // User is now authenticated
    router.push('/dashboard');
  }}
  onError={(error) => {
    console.error('Error:', error);
  }}
/>
```

**If using the widget directly:**

```javascript
const configuration = {
  widgetId: "your_widget_id",
  success: async (data) => {
    // data.token contains the access token
    if (data.token) {
      // Send to your server for verification
      const response = await fetch('/api/auth/verify-widget-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: data.token }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Token verified, user authenticated
        window.location.href = '/dashboard';
      }
    }
  },
  failure: (error) => {
    console.error('Error:', error);
  }
};

window.initSendOTP(configuration);
```

### Step 2: Verify Your API Endpoint is Working

Test the token verification endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/verify-widget-token \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "your_token_from_widget"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "user": {
      "id": "...",
      "phone": "+919999999999",
      "is_phone_verified": true
    }
  }
}
```

### Step 3: Check Server Logs

Check your server logs for:
- Token verification requests
- Any errors during verification
- User creation/authentication

## 🔧 Common Issues & Fixes

### Issue 1: Widget Success Callback Not Called

**Problem**: Access token is generated but not sent to server.

**Fix**:
- Ensure `success` callback is properly configured
- Check browser console for errors
- Verify widget initialization is successful

### Issue 2: Token Verification Fails

**Problem**: Token is sent but verification fails on server.

**Check**:
1. **MSG91_AUTH_KEY** is correct in `.env.local`
2. Token is not expired (tokens expire quickly)
3. Token format is correct (should be a JWT string)

**Debug**:
```typescript
// In verify-widget-token route, add logging:
console.log('[Verify Token] Received token:', accessToken?.substring(0, 20) + '...');
console.log('[Verify Token] MSG91 response:', verifyResult);
```

### Issue 3: Token Expired

**Problem**: Access tokens from MSG91 expire quickly (usually within minutes).

**Fix**:
- Verify token immediately after receiving it
- Don't store token for later verification
- Handle token expiration gracefully

### Issue 4: Widget Not Initialized Properly

**Problem**: Widget isn't calling success callback.

**Fix**:
- Ensure widget script is loaded: `https://verify.msg91.com/otp-provider.js`
- Check `window.initSendOTP` is available
- Verify widget configuration is correct

## 📝 Complete Integration Example

### Frontend (React/Next.js)

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Load MSG91 widget script
    const script = document.createElement('script');
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.initSendOTP === 'function') {
        window.initSendOTP({
          widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!,
          exposeMethods: true,
          success: async (data) => {
            console.log('OTP verified, token received:', data.token);
            
            // Verify token on server
            try {
              const response = await fetch('/api/auth/verify-widget-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: data.token }),
              });

              const result = await response.json();
              
              if (result.success) {
                console.log('Token verified, user authenticated');
                router.push('/dashboard');
              } else {
                console.error('Token verification failed:', result.error);
                alert('Authentication failed. Please try again.');
              }
            } catch (error) {
              console.error('Error verifying token:', error);
              alert('Error verifying token. Please try again.');
            }
          },
          failure: (error) => {
            console.error('Widget error:', error);
            alert('OTP verification failed. Please try again.');
          },
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const scriptElement = document.querySelector('script[src*="otp-provider.js"]');
      if (scriptElement) scriptElement.remove();
    };
  }, [router]);

  return (
    <div>
      <h1>Login with OTP</h1>
      <div id="msg91-otp-widget"></div>
    </div>
  );
}
```

### Backend (Already Implemented)

The endpoint `/api/auth/verify-widget-token` is already set up and will:
1. Verify the access token with MSG91
2. Extract phone number from token
3. Create/update user in database
4. Generate session token
5. Set authentication cookie

## ✅ Verification Checklist

- [ ] Widget is initialized with `success` callback
- [ ] Success callback sends token to `/api/auth/verify-widget-token`
- [ ] `MSG91_AUTH_KEY` is set correctly in `.env.local`
- [ ] Token verification endpoint is working
- [ ] User is redirected after successful verification
- [ ] Error handling is in place

## 🧪 Testing Steps

1. **Test Widget Initialization**:
   - Open browser console
   - Check for widget script loading
   - Verify `window.initSendOTP` is available

2. **Test OTP Flow**:
   - Enter phone number
   - Enter OTP
   - Check console for success callback
   - Verify token is received

3. **Test Token Verification**:
   - Check network tab for `/api/auth/verify-widget-token` request
   - Verify response is successful
   - Check user is authenticated (session cookie set)

4. **Check MSG91 Dashboard**:
   - Go to Logs
   - Find your request
   - Status should change from "Access token unverified" to verified
   - (Note: Status might not update immediately in dashboard)

## 🆘 Still Having Issues?

1. **Check Browser Console**:
   - Look for JavaScript errors
   - Check if success callback is being called
   - Verify token is being received

2. **Check Server Logs**:
   - Look for token verification requests
   - Check for any errors in `/api/auth/verify-widget-token`
   - Verify MSG91 API responses

3. **Test Token Manually**:
   ```bash
   # Get token from widget success callback
   # Then test verification:
   curl -X POST http://localhost:3000/api/auth/verify-widget-token \
     -H "Content-Type: application/json" \
     -d '{"accessToken": "your_token_here"}'
   ```

4. **Contact Support**:
   - MSG91 Support: support@msg91.com
   - Provide: Widget ID, reqId, error messages

---

## 📌 Key Points

- **"Access token unverified"** means the token exists but hasn't been verified on your server
- The widget generates the token automatically after OTP verification
- You must send this token to your server endpoint to complete authentication
- The `/api/auth/verify-widget-token` endpoint handles this automatically if you use the `Msg91Widget` component with `autoVerifyToken={true}`

---

**Quick Fix**: Ensure your widget's `success` callback sends the `data.token` to `/api/auth/verify-widget-token` endpoint.

