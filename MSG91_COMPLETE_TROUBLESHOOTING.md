# MSG91 Complete Troubleshooting Guide

## 🔴 Current Issues

1. ❌ **OTP not received in WhatsApp**
2. ❌ **Auth verification failed**

## Issue 1: OTP Not Received in WhatsApp

### Step 1: Check WhatsApp Setup in MSG91

1. **Go to MSG91 Dashboard** → **WhatsApp** → **Setup**
2. **Verify**:
   - ✅ WhatsApp Business account is **connected**
   - ✅ Account status is **Active**
   - ✅ Phone number is verified

### Step 2: Check WhatsApp Template

1. **Go to**: **WhatsApp** → **Templates**
2. **Verify**:
   - ✅ OTP template exists
   - ✅ Template status is **Approved** (not Pending/Rejected)
   - ✅ Template has OTP placeholder: `{{1}}`
   - ✅ Template is linked to your widget

### Step 3: Check Widget WhatsApp Channel

1. **Go to**: **OTP** → **Widget** → Your Widget → **Settings**
2. **Verify**:
   - ✅ **WhatsApp** channel is **Enabled**
   - ✅ WhatsApp template is selected
   - ✅ WhatsApp number is correct

### Step 4: Check Delivery Status

1. **Go to**: **OTP** → **Widget/SDK** → **Logs**
2. **Find your request** by phone number or reqId
3. **Click verification icons** to see details
4. **Check delivery status**:
   - ✅ **Delivered**: Check WhatsApp (may be in spam/archived)
   - ⏳ **Pending**: Wait a few minutes
   - ❌ **Failed**: Check error reason

### Step 5: Common WhatsApp Issues

**Issue A: Template Not Approved**
- **Fix**: Wait for template approval (24-48 hours) or use approved template

**Issue B: Wrong WhatsApp Number**
- **Fix**: Ensure you're checking the WhatsApp number linked to MSG91

**Issue C: WhatsApp Business Account Not Connected**
- **Fix**: Connect WhatsApp Business account in MSG91 Dashboard

**Issue D: Template Format Wrong**
- **Fix**: Template must have OTP placeholder: `{{1}}`

### Alternative: Use SMS Instead

If WhatsApp isn't working, switch to SMS:

1. **Go to**: **OTP** → **Widget** → Your Widget → **Settings**
2. **Enable SMS** channel
3. **Disable WhatsApp** (temporarily for testing)
4. **Save** and test again

---

## Issue 2: Auth Verification Failed

### Step 1: Check if Token is Received

**In Browser Console**, check if widget success callback is called:

```javascript
// Should see in console:
[MSG91 Widget] Success callback: { token: "...", identifier: "...", phone: "..." }
```

**If token is NOT received**:
- Widget success callback not being called
- OTP verification failed in widget
- Check widget initialization

### Step 2: Check Token Verification Request

**In Browser Network Tab**, check:
- Request to `/api/auth/verify-widget-token`
- Request payload contains `accessToken`
- Response status and error message

### Step 3: Check Server Logs

**Look for**:
```
[MSG91] Verifying access token from widget
[MSG91] Verify token response status: 200
[MSG91] Verify token response body: {...}
```

**Common Errors**:

**Error 1: "MSG91_AUTH_KEY not set"**
```bash
# Fix: Add to .env.local
MSG91_AUTH_KEY=your_authkey_here
```

**Error 2: "MSG91 Token Verification Failed (401)"**
- Check `MSG91_AUTH_KEY` is correct
- Verify authkey is active in MSG91 dashboard
- Check authkey has OTP service enabled

**Error 3: "Token is valid and not expired"**
- Token might be expired (tokens expire quickly)
- Verify token immediately after receiving it
- Don't store token for later use

**Error 4: "Phone number not found in verification result"**
- MSG91 didn't return phone number in token
- Check token verification response
- May need to extract from identifier field

### Step 4: Debug Token Verification

Add this to your code to debug:

```typescript
// In verify-widget-token route, add:
console.log('[Debug] Access token received:', accessToken?.substring(0, 20) + '...');
console.log('[Debug] MSG91_AUTH_KEY exists:', !!process.env.MSG91_AUTH_KEY);
console.log('[Debug] MSG91_AUTH_KEY length:', process.env.MSG91_AUTH_KEY?.length);
```

### Step 5: Test Token Verification Manually

```bash
# Get token from widget success callback (browser console)
# Then test:
curl -X POST http://localhost:3000/api/auth/verify-widget-token \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "your_token_here"}'
```

---

## 🔧 Complete Fix Checklist

### For WhatsApp OTP Not Received:

- [ ] WhatsApp Business account connected in MSG91
- [ ] WhatsApp template is approved
- [ ] Widget has WhatsApp channel enabled
- [ ] Correct WhatsApp template selected in widget
- [ ] Checking correct WhatsApp number
- [ ] Checked WhatsApp spam/archived messages
- [ ] Delivery status checked in MSG91 logs
- [ ] Alternative: Try SMS channel

### For Auth Verification Failed:

- [ ] `MSG91_AUTH_KEY` is set in `.env.local`
- [ ] Authkey is correct and active
- [ ] Widget success callback is being called
- [ ] Token is received in success callback
- [ ] Token is sent to `/api/auth/verify-widget-token`
- [ ] Server receives token verification request
- [ ] MSG91 API responds successfully
- [ ] Phone number extracted correctly
- [ ] User created/updated in database
- [ ] Session token generated

---

## 🧪 Step-by-Step Debugging

### Step 1: Test Widget Initialization

```javascript
// In browser console:
console.log('Widget available:', typeof window.initSendOTP === 'function');
```

### Step 2: Test OTP Sending

```javascript
// Check if OTP is sent:
// Look in MSG91 Dashboard → Logs
// Should see entry with your phone number
```

### Step 3: Test OTP Verification

```javascript
// After entering OTP, check console:
// Should see: [MSG91 Widget] Success callback: { token: "..." }
```

### Step 4: Test Token Verification

```javascript
// Check network tab for:
// POST /api/auth/verify-widget-token
// Should return: { success: true, data: { user: {...} } }
```

---

## 🆘 Quick Fixes

### Fix 1: Switch to SMS (Immediate)

1. MSG91 Dashboard → OTP → Widget → Settings
2. Enable SMS, disable WhatsApp
3. Test with SMS

### Fix 2: Check Environment Variables

```bash
# Verify in .env.local:
MSG91_AUTH_KEY=your_key_here
MSG91_WIDGET_ID=your_widget_id_here
```

### Fix 3: Verify Widget Success Callback

```javascript
// Ensure success callback sends token:
success: async (data) => {
  console.log('Token received:', data.token);
  if (data.token) {
    const response = await fetch('/api/auth/verify-widget-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: data.token }),
    });
    const result = await response.json();
    console.log('Verification result:', result);
  }
}
```

### Fix 4: Check MSG91 Dashboard Logs

1. Go to OTP → Widget/SDK → Logs
2. Find your request
3. Click verification icons
4. Check error messages

---

## 📞 Still Not Working?

### Contact MSG91 Support

1. **Email**: support@msg91.com
2. **Provide**:
   - Widget ID
   - reqId from logs
   - Phone number (masked)
   - Error messages
   - Screenshots of logs

### Alternative: Use Manual OTP Flow

Instead of widget, use manual OTP API:

```typescript
// Use /api/auth/send-otp and /api/auth/verify-otp
// These don't require widget token verification
```

---

## ✅ Success Indicators

**When everything works**:
- ✅ OTP received on WhatsApp/SMS
- ✅ Widget success callback called with token
- ✅ Token sent to `/api/auth/verify-widget-token`
- ✅ Server verifies token successfully
- ✅ User authenticated (session cookie set)
- ✅ Redirected to dashboard

---

## 🔍 Debug Commands

```bash
# Check environment variables
echo $MSG91_AUTH_KEY
echo $MSG91_WIDGET_ID

# Test OTP send
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999", "countryCode": "91"}'

# Test token verification (get token from widget first)
curl -X POST http://localhost:3000/api/auth/verify-widget-token \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "token_from_widget"}'
```

---

**Most Common Fixes**:
1. **WhatsApp**: Enable SMS channel as alternative
2. **Token Verification**: Check `MSG91_AUTH_KEY` is correct
3. **Widget Callback**: Ensure success callback sends token to server

