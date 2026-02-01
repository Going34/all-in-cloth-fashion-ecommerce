# MSG91 Widget vs Manual Test - Configuration Guide

## ✅ Good News: Manual Test Works!

Since the **manual test method works** and you receive the OTP code, this confirms:
- ✅ WhatsApp number `919646656715` is working
- ✅ Template "code" is approved and functional
- ✅ WhatsApp delivery is working
- ✅ Your phone number can receive messages

## 🔍 The Issue: Widget Configuration

The problem is that the **Widget API** might be using different settings than the manual test. Let's align them.

## 📋 What Works in Manual Test

From your screenshots, the manual test uses:
- **From Number**: `919646656715`
- **Template**: `code`
- **Variable**: `body_1` = `2343` (or custom value)
- **Phone Format**: `91989XXXXXX0` (with country code, no +)

## 🔧 Widget Configuration Check

### Step 1: Verify Widget Settings Match Manual Test

1. **Go to**: MSG91 Dashboard → **OTP** → **Widget** → **"code"** widget
2. **Check Settings**:
   - **WhatsApp Number**: Should be `919646656715` (same as manual test)
   - **Template**: Should be `code` (same as manual test)
   - **Channel**: WhatsApp should be enabled
   - **Route**: Should be Transactional (not Promotional)

### Step 2: Check Widget Template Configuration

The widget might be using a different template or variable mapping:

1. **Go to**: **OTP** → **Widget** → **"code"** → **Settings** → **Template**
2. **Verify**:
   - Template name: `code`
   - Template variables match manual test
   - Template is approved (not just enabled)

### Step 3: Verify Phone Number Format

The widget API might be sending phone numbers in a different format:

**Manual Test Format**: `91989XXXXXX0` (country code + phone, no +)

**Widget API Format**: Should be the same - `91989XXXXXX0`

Check your code is sending:
```typescript
// Should send: "919899999999" (no +, no spaces)
const identifier = toMsg91Mobile(countryCode, phoneNumber);
// Result: "919899999999" ✅
```

### Step 4: Check Widget Variable Mapping

The manual test uses `body_1` variable. The widget should use the same:

1. **Widget Settings** → **Template Variables**
2. **Ensure** `body_1` is configured correctly
3. **Or** check if widget needs different variable name

## 🔍 Debugging Steps

### Step 1: Compare Widget vs Manual Test Logs

1. **Send OTP via Widget** (your app)
2. **Send OTP via Manual Test** (MSG91 dashboard)
3. **Compare** in MSG91 Dashboard → **WhatsApp** → **Logs**:
   - Template used
   - From number
   - Phone number format
   - Variable values
   - Delivery status

### Step 2: Check Widget API Request

Add logging to see what widget API is sending:

```typescript
// In services/msg91Service.ts, sendOtp function
console.log('[MSG91 Widget] Request body:', JSON.stringify(requestBody, null, 2));
```

**Expected format**:
```json
{
  "widgetId": "your_widget_id",
  "identifier": "919899999999",
  "captchaToken": "..." // if required
}
```

### Step 3: Verify Widget ID

Ensure you're using the correct widget ID:

1. **Go to**: **OTP** → **Widget**
2. **Find widget** named "code"
3. **Copy Widget ID**
4. **Verify** in your `.env.local`:
   ```bash
   MSG91_WIDGET_ID=your_widget_id_here
   ```

## 🔧 Common Differences

### Difference 1: Template Selection

**Manual Test**: You explicitly select template "code"
**Widget**: Widget might be using a different template

**Fix**: Verify widget template selection in widget settings

### Difference 2: Variable Mapping

**Manual Test**: You set `body_1 = 2343`
**Widget**: Widget might not be setting variables correctly

**Fix**: Check widget template variable configuration

### Difference 3: Phone Number Format

**Manual Test**: `91989XXXXXX0` (country code + phone)
**Widget**: Might be sending in different format

**Fix**: Verify `toMsg91Mobile()` function output

### Difference 4: Route Type

**Manual Test**: Might use different route
**Widget**: Should use Transactional route

**Fix**: Check widget route settings

## ✅ Quick Fix Checklist

- [ ] Widget uses same WhatsApp number: `919646656715`
- [ ] Widget uses same template: `code`
- [ ] Widget has WhatsApp channel enabled
- [ ] Phone number format matches: `91989XXXXXX0` (no +, no spaces)
- [ ] Widget template variables are configured
- [ ] Widget ID in `.env.local` matches widget "code"
- [ ] Widget route is Transactional

## 🧪 Test Comparison

### Manual Test (Working):
- From: `919646656715`
- Template: `code`
- To: `91989XXXXXX0`
- Variable: `body_1 = 2343`
- Result: ✅ OTP received

### Widget Test (Not Working):
- Check logs for:
  - From number
  - Template used
  - To number format
  - Variables sent
  - Delivery status

## 🔍 What to Check in Widget Settings

1. **Widget Name**: "code"
2. **WhatsApp Number**: `919646656715`
3. **Template**: `code`
4. **Template Variables**: Should match manual test
5. **Channel Priority**: WhatsApp should be first/primary
6. **Route**: Transactional

## 📝 Next Steps

1. **Compare Widget Logs with Manual Test Logs**:
   - Go to MSG91 Dashboard → **WhatsApp** → **Logs**
   - Find widget-sent message
   - Find manual test message
   - Compare all fields

2. **Check Widget Template Configuration**:
   - Ensure widget is using template "code"
   - Verify variable mapping matches

3. **Verify Phone Number Format**:
   - Check server logs for identifier format
   - Should be: `919899999999` (no +, no spaces)

4. **Test with Same Phone Number**:
   - Use the same phone number for both widget and manual test
   - Compare results

## 🆘 If Still Not Working

If widget still doesn't work but manual test does:

1. **Check Widget API vs Manual API**:
   - Widget uses: `POST /api/v5/widget/sendOtp`
   - Manual might use different endpoint
   - Compare request formats

2. **Try Different Widget**:
   - Create a new widget
   - Configure exactly like manual test
   - Test again

3. **Use Manual API Instead**:
   - If widget continues to fail
   - Use direct OTP API (not widget API)
   - See `MSG91_SETUP.md` for direct API usage

---

**Key Insight**: Since manual test works, the issue is configuration mismatch between widget settings and manual test settings. Align them and it should work!

