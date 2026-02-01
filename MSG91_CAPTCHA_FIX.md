# Fix MSG91 "Invalid Captcha Token" Error

## 🔴 Error Message

```
{
  "success": false,
  "error": {
    "message": "MSG91 send OTP failed: Invalid Captcha Token..",
    "code": "INTERNAL_ERROR"
  }
}
```

## 🔍 What This Means

MSG91 has **reCAPTCHA protection enabled** by default in your widget settings. This requires a valid CAPTCHA token to be sent with each OTP request.

## ✅ Solution Options

You have **two options** to fix this:

### Option 1: Disable CAPTCHA (Recommended for Development)

**Easiest solution** - Disable CAPTCHA validation in your MSG91 widget settings.

#### Steps:

1. **Login to MSG91 Dashboard**
   - Go to: https://control.msg91.com/
   - Login with your credentials

2. **Navigate to Widget Settings**
   - Click: **OTP** (left sidebar)
   - Click: **Widget**
   - Click on your widget name to open settings

3. **Disable CAPTCHA**
   - Look for **"CAPTCHA Validation"** or **"reCAPTCHA"** setting
   - Toggle it to **OFF** or **Disabled**
   - Click **Save**

4. **Test Again**
   - Try sending OTP again - it should work without CAPTCHA token

#### ⚠️ Note:
- This is fine for development/testing
- For production, consider keeping CAPTCHA enabled for security

---

### Option 2: Integrate Google reCAPTCHA (For Production)

If you want to keep CAPTCHA enabled for security, you need to integrate Google reCAPTCHA on your frontend.

#### Step 1: Get reCAPTCHA Site Key

1. Go to: https://www.google.com/recaptcha/admin
2. Click **+** to create a new site
3. Choose **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
4. Add your domain (e.g., `localhost` for dev, your domain for production)
5. Copy the **Site Key** (you'll need this)
6. Copy the **Secret Key** (keep it secret, server-side only)

#### Step 2: Install reCAPTCHA

**Option A: Using react-google-recaptcha (Recommended)**

```bash
npm install react-google-recaptcha
```

**Option B: Direct Script Integration**

Add to your HTML:
```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

#### Step 3: Update Your Login Component

```tsx
'use client';

import { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { sendOtp } = useAuth();

  const handleSendOtp = async () => {
    if (!captchaToken) {
      alert('Please complete the CAPTCHA');
      return;
    }

    const result = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        countryCode,
        captchaToken, // Include CAPTCHA token
      }),
    });

    const data = await result.json();
    if (data.success) {
      // Proceed with OTP verification
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
      />
      
      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        onChange={(token) => setCaptchaToken(token)}
        onExpired={() => setCaptchaToken(null)}
      />
      
      <button onClick={handleSendOtp}>Send OTP</button>
    </div>
  );
}
```

#### Step 4: Add Environment Variables

Add to `.env.local`:

```bash
# Google reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here  # Server-side only
```

#### Step 5: Update API Endpoint (Already Done)

The API endpoint already accepts `captchaToken` parameter. Just make sure to pass it from the frontend.

---

## 🧪 Testing Without CAPTCHA

If you disabled CAPTCHA, test with:

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999", "countryCode": "91"}'
```

Should return:
```json
{
  "success": true,
  "data": {
    "otpRequired": true,
    "reqId": "..."
  }
}
```

---

## 🔧 Quick Fix Summary

**For immediate fix (Development):**
1. Go to MSG91 Dashboard → OTP → Widget → Your Widget
2. Disable CAPTCHA Validation
3. Save
4. Test again ✅

**For production (Recommended):**
1. Get Google reCAPTCHA keys
2. Install `react-google-recaptcha`
3. Add reCAPTCHA component to login page
4. Pass `captchaToken` to API
5. Keep CAPTCHA enabled in MSG91 for security ✅

---

## 📝 Code Changes Made

The following files have been updated to support CAPTCHA tokens:

1. ✅ `services/msg91Service.ts` - Added `captchaToken` parameter to `sendOtp()`
2. ✅ `app/api/auth/send-otp/route.ts` - Accepts `captchaToken` from client
3. ✅ Better error messages for CAPTCHA errors

You can now:
- **Option 1**: Disable CAPTCHA in MSG91 dashboard (easiest)
- **Option 2**: Pass `captchaToken` in your API requests

---

## 🆘 Still Having Issues?

1. **Check MSG91 Dashboard**
   - Verify widget is active
   - Check CAPTCHA setting status
   - Verify widget ID is correct

2. **Check Environment Variables**
   - `MSG91_AUTH_KEY` is set correctly
   - `MSG91_WIDGET_ID` is set correctly

3. **Check API Logs**
   - Look for detailed error messages
   - Check if CAPTCHA token is being sent

4. **Contact Support**
   - MSG91 Support: https://msg91.com/support
   - Check MSG91 documentation: https://docs.msg91.com

