# MSG91 OTP Not Received - Troubleshooting Guide

## 🔴 Problem

- ✅ OTP request is successful (you get `reqId`)
- ✅ MSG91 dashboard shows "Message Sent"
- ❌ But you're **NOT receiving the OTP** on your phone

## 🔍 Common Causes & Solutions

### 1. **DND (Do Not Disturb) Registry Issue** ⚠️ MOST COMMON FOR INDIA

**Problem**: In India, if your number is registered on DND (Do Not Disturb), promotional SMS won't be delivered.

**Solution**:
1. **Check DND Status**:
   - Visit: https://www.nationalconsumerhelpline.com/dnd/
   - Enter your phone number
   - Check if it's registered on DND

2. **Register for Transactional SMS**:
   - MSG91 needs to register your sender ID for transactional SMS
   - Go to MSG91 Dashboard → **Settings** → **Sender ID**
   - Ensure your sender ID is registered for **Transactional** messages (not Promotional)

3. **Use Transactional Route**:
   - In your widget settings, ensure you're using **Transactional** route
   - Go to: **OTP** → **Widget** → Your Widget → **Settings**
   - Check **Route Type**: Should be **Transactional** (not Promotional)

---

### 2. **Phone Number Format Issue**

**Problem**: Phone number might be incorrectly formatted.

**Check**:
- Phone number should be **10 digits** for India (without country code)
- Country code should be **91** for India
- No spaces, dashes, or special characters

**Example**:
```json
✅ Correct: { "phone": "9999999999", "countryCode": "91" }
❌ Wrong: { "phone": "+91 99999 99999", "countryCode": "91" }
❌ Wrong: { "phone": "999-999-9999", "countryCode": "91" }
```

**Verify in MSG91 Dashboard**:
- Check the **identifier** format in logs
- Should be: `919999999999` (country code + phone, no + sign)

---

### 3. **SMS/WhatsApp Channel Not Enabled or Misconfigured**

**Problem**: 
- SMS channel might be disabled in widget settings
- OR only WhatsApp is enabled but WhatsApp isn't set up properly
- OR you're expecting SMS but OTPs are being sent via WhatsApp

**Solution**:
1. Go to MSG91 Dashboard → **OTP** → **Widget**
2. Click on your widget (e.g., "code")
3. Go to **Channels** or **Settings**
4. **For SMS**:
   - Ensure **SMS** channel is **Enabled**
   - Check SMS template is approved
5. **For WhatsApp**:
   - Ensure **WhatsApp** channel is **Enabled**
   - Verify WhatsApp Business account is connected (WhatsApp → Setup)
   - Check WhatsApp template is approved
6. **Check Logs**: Look at the Channel column - if you see WhatsApp icons, OTPs are going via WhatsApp
7. Click **Save**

**Quick Fix**: If WhatsApp isn't working, enable SMS channel and test with SMS instead.

---

### 4. **Template Not Approved**

**Problem**: SMS template might not be approved by MSG91 or carrier.

**Solution**:
1. Go to MSG91 Dashboard → **OTP** → **Widget** → Your Widget
2. Check **Template** section
3. Ensure template is **Approved** (not Pending or Rejected)
4. If rejected, check rejection reason and fix it
5. For India: Templates need to be approved by TRAI/DLT

**For India (DLT Registration)**:
- Register your template on DLT portal: https://www.dltconnect.in/
- Get DLT template ID
- Add DLT template ID in MSG91 widget settings

---

### 5. **Account Balance/Credits**

**Problem**: MSG91 account might have insufficient balance.

**Solution**:
1. Go to MSG91 Dashboard → **Account** → **Balance**
2. Check if you have sufficient credits
3. If balance is low, add credits
4. Check if there are any payment issues

---

### 6. **Delivery Delays**

**Problem**: SMS delivery can be delayed (especially during peak hours).

**Solution**:
- Wait **2-5 minutes** before retrying
- Check MSG91 dashboard → **Reports** → **Delivery Status**
- Look for delivery status: **Delivered**, **Pending**, **Failed**

---

### 7. **Wrong Phone Number**

**Problem**: You might be testing with a wrong or inactive number.

**Solution**:
- Double-check the phone number you're using
- Ensure the number is active and can receive SMS
- Try with a different number to isolate the issue

---

### 8. **Network/Carrier Issues**

**Problem**: Your carrier might be blocking or delaying SMS.

**Solution**:
- Try with a different carrier/number
- Check if you can receive other SMS on that number
- Contact your carrier if SMS are generally not working

---

### 9. **Widget Configuration Issues**

**Problem**: Widget might not be properly configured.

**Check Widget Settings**:
1. **Widget Status**: Should be **Active** (not Inactive)
2. **OTP Length**: Usually 4-6 digits
3. **Expiry Time**: Set appropriately (5-10 minutes)
4. **Channels**: SMS and/or WhatsApp enabled
5. **Route**: Transactional (not Promotional)

---

### 10. **Check MSG91 Delivery Reports**

**Most Important**: Check delivery status in MSG91 dashboard.

**Steps**:
1. Go to MSG91 Dashboard → **OTP** → **Widget/SDK** → **Logs**
2. Find your request using `reqId` or search by phone number
3. Click on the **Verification icons** (list/hexagon icons) or **Req. ID** to view details
4. Check **Delivery Status**:
   - ✅ **Delivered**: OTP was delivered (check phone/spam/WhatsApp)
   - ⏳ **Pending**: Still being processed (wait a few minutes)
   - ❌ **Failed**: Check failure reason

**Note**: If you see WhatsApp icons in the Channel column, OTPs are being sent via WhatsApp, not SMS. Check:
- WhatsApp Business account is connected
- WhatsApp template is approved
- You're checking the correct WhatsApp number

**Common Failure Reasons**:
- **Invalid Number**: Phone number format issue
- **DND Active**: Number on DND registry
- **Template Rejected**: Template not approved
- **Insufficient Balance**: No credits in account
- **Carrier Rejected**: Carrier blocked the message

---

## 🧪 Testing Steps

### Step 1: Verify Phone Number Format

Check what's being sent to MSG91:

```bash
# Check server logs for:
[MSG91] Identifier: 919999999999
```

Should be: `countryCode + phoneNumber` (no +, no spaces)

### Step 2: Test with MSG91 Dashboard

1. Go to MSG91 Dashboard → **OTP** → **Widget** → **Test**
2. Enter your phone number
3. Click **Send Test OTP**
4. Check if you receive it

If it works in dashboard but not in your app:
- Check phone number format in your code
- Check identifier format

### Step 3: Check Delivery Reports

1. Go to **Reports** → **OTP Reports**
2. Find your `reqId`: `36616f6d3545343031313339`
3. Check delivery status and error message

### Step 4: Verify Widget Configuration

1. Widget is **Active**
2. SMS channel is **Enabled**
3. Template is **Approved**
4. Route is **Transactional** (for India)
5. Sender ID is registered for **Transactional**

---

## 🔧 Quick Fixes

### Fix 1: Enable Transactional Route (India)

1. MSG91 Dashboard → **OTP** → **Widget** → Your Widget
2. **Settings** → **Route Type** → Select **Transactional**
3. **Save**

### Fix 2: Register Sender ID for Transactional

1. MSG91 Dashboard → **Settings** → **Sender ID**
2. Register your sender ID for **Transactional** messages
3. Wait for approval (usually 24-48 hours)

### Fix 3: Check DLT Registration (India)

1. Register on DLT: https://www.dltconnect.in/
2. Get DLT template ID
3. Add DLT template ID in widget settings

### Fix 4: Use WhatsApp Channel

If SMS is not working, try WhatsApp:

1. MSG91 Dashboard → **WhatsApp** → **Setup**
2. Connect WhatsApp Business account
3. Enable WhatsApp in widget settings
4. WhatsApp OTP usually has better delivery rates

---

## 📊 Debugging Checklist

- [ ] Phone number format is correct (10 digits for India)
- [ ] Country code is correct (91 for India)
- [ ] SMS channel is enabled in widget
- [ ] Widget is active
- [ ] Template is approved
- [ ] Route type is Transactional (for India)
- [ ] Sender ID is registered for Transactional
- [ ] Account has sufficient balance
- [ ] DND status checked (for India)
- [ ] Delivery report checked in MSG91 dashboard
- [ ] Tested with MSG91 dashboard test tool
- [ ] Tried with different phone number
- [ ] Waited 2-5 minutes for delivery

---

## 🆘 Still Not Working?

### Contact MSG91 Support

1. **Email**: support@msg91.com
2. **Provide**:
   - Your `reqId`: `36616f6d3545343031313339`
   - Phone number (masked for security)
   - Widget ID
   - Screenshot of delivery report
   - Error message (if any)

### Alternative: Use WhatsApp OTP

WhatsApp OTP has better delivery rates:

1. Setup WhatsApp Business API in MSG91
2. Enable WhatsApp channel in widget
3. WhatsApp OTP usually delivers faster and more reliably

---

## 📝 Code Verification

Check your phone number format in the code:

```typescript
// Should send: "919999999999" (country code + phone, no +)
const identifier = toMsg91Mobile(countryCode, phoneNumber);
// Result: "919999999999" ✅

// NOT: "+919999999999" ❌
// NOT: "91 99999 99999" ❌
```

---

## ✅ Success Indicators

When everything is working:
- ✅ `reqId` is returned
- ✅ MSG91 dashboard shows "Sent"
- ✅ Delivery report shows "Delivered"
- ✅ OTP received on phone within 1-2 minutes
- ✅ OTP can be verified successfully

---

## 🔄 Next Steps

1. **Check MSG91 Dashboard Delivery Reports** (most important)
2. **Verify Widget Settings** (SMS enabled, Transactional route)
3. **Check DND Status** (for India)
4. **Verify Phone Number Format** in logs
5. **Test with MSG91 Dashboard** test tool
6. **Contact MSG91 Support** if still not working

---

**Most Common Fix**: Enable **Transactional Route** and ensure **Sender ID** is registered for Transactional messages (especially for India).

