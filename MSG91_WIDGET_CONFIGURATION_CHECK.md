# MSG91 Widget Configuration Check - Manual Test Works!

## ✅ Confirmed: Manual Test Works!

Since you receive OTP when using **"Test"** button in MSG91 dashboard, we know:
- ✅ WhatsApp number `919646656715` is working
- ✅ Template "code" is approved and functional  
- ✅ Delivery is working
- ✅ Your setup is correct

## 🔍 The Problem: Widget Configuration Mismatch

The widget API might be using different settings. Let's align them.

## 📋 What Manual Test Uses (Working)

From your screenshots:
- **From Number**: `919646656715`
- **Template**: `code`
- **Phone Format**: `91989XXXXXX0` (country code + phone, no +)
- **Variable**: `body_1` with custom value

## ✅ Step-by-Step Widget Configuration Check

### Step 1: Verify Widget Settings

1. **Go to**: MSG91 Dashboard → **OTP** → **Widget** → Click on widget **"code"**
2. **Check these settings match manual test**:

   **Settings Tab**:
   - ✅ **Widget Name**: `code`
   - ✅ **Status**: Active/Enabled
   - ✅ **WhatsApp Number**: `919646656715` (same as manual test)
   - ✅ **Template**: `code` (same as manual test)
   - ✅ **Route**: Transactional (not Promotional)

   **Channels Tab**:
   - ✅ **WhatsApp**: Enabled
   - ✅ **SMS**: Can be enabled as fallback
   - ✅ **Email**: Optional

   **Template Tab**:
   - ✅ **Template Name**: `code`
   - ✅ **Template Status**: Approved (not just Enabled)
   - ✅ **Variables**: Should match manual test

### Step 2: Compare Logs

**Compare widget request vs manual test**:

1. **Send OTP via your app** (widget method)
2. **Send OTP via manual test** (MSG91 dashboard)
3. **Go to**: MSG91 Dashboard → **WhatsApp** → **Logs**
4. **Compare both entries**:

   | Field | Manual Test | Widget API | Match? |
   |-------|-------------|------------|--------|
   | From Number | `919646656715` | `919646656715` | ✅ Should match |
   | Template | `code` | `code` | ✅ Should match |
   | To Number | `91989XXXXXX0` | `91989XXXXXX0` | ✅ Should match |
   | Variables | `body_1=2343` | `body_1=?` | ⚠️ Check this |
   | Delivery Status | Delivered | ? | ⚠️ Check this |

### Step 3: Check Phone Number Format

**Manual test format**: `91989XXXXXX0` (no +, no spaces)

**Verify your code sends the same format**:

Check server logs when sending OTP:
```
[MSG91] Identifier: 919899999999
```

Should be: `91` + `10 digit phone` = `919899999999` ✅

**If different**, check `toMsg91Mobile()` function output.

### Step 4: Verify Widget ID

1. **Go to**: **OTP** → **Widget** → Widget **"code"**
2. **Copy Widget ID** (long hex string)
3. **Check** in your `.env.local`:
   ```bash
   MSG91_WIDGET_ID=your_widget_id_here
   ```
4. **Verify** it matches the widget you're testing

## 🔧 Common Widget Configuration Issues

### Issue 1: Wrong Template Selected

**Symptom**: Widget uses different template than manual test

**Fix**:
1. Widget Settings → Template
2. Select template `code` (same as manual test)
3. Save

### Issue 2: Wrong WhatsApp Number

**Symptom**: Widget uses different WhatsApp number

**Fix**:
1. Widget Settings → WhatsApp Number
2. Select `919646656715` (same as manual test)
3. Save

### Issue 3: Phone Number Format Mismatch

**Symptom**: Widget sends phone in wrong format

**Check**:
- Server logs show: `[MSG91] Identifier: 919899999999`
- Should match manual test format exactly

**Fix**: Verify `toMsg91Mobile()` function

### Issue 4: Template Variables Not Set

**Symptom**: Widget doesn't set `body_1` variable

**Fix**:
1. Widget Settings → Template Variables
2. Configure `body_1` variable
3. Or check if widget auto-generates OTP (might not need variables)

### Issue 5: Route Type Mismatch

**Symptom**: Widget uses Promotional route (blocked by DND)

**Fix**:
1. Widget Settings → Route
2. Change to **Transactional**
3. Save

## 🧪 Debugging Steps

### Step 1: Check Server Logs

When you send OTP via widget, check server logs:

```
[MSG91] Sending OTP via Widget API
[MSG91] Widget ID: 36616f67...
[MSG91] Identifier: 919899999999
[MSG91] Request body being sent: {
  "widgetId": "...",
  "identifier": "919899999999"
}
```

**Compare with manual test**:
- Widget ID should match widget "code"
- Identifier should match phone format: `919899999999`

### Step 2: Check MSG91 Dashboard Logs

1. **Go to**: **WhatsApp** → **Logs**
2. **Find widget-sent message** (recent)
3. **Find manual test message** (recent)
4. **Compare**:
   - From number
   - Template
   - To number
   - Delivery status
   - Error messages (if any)

### Step 3: Test with Same Phone Number

1. **Use same phone number** for both:
   - Widget test: `919899999999`
   - Manual test: `919899999999`
2. **Compare results**
3. **Check delivery status** in logs

## ✅ Quick Fix Checklist

Before testing widget again, verify:

- [ ] Widget name is "code" (matches manual test)
- [ ] Widget WhatsApp number is `919646656715` (matches manual test)
- [ ] Widget template is "code" (matches manual test)
- [ ] Widget route is Transactional
- [ ] Widget has WhatsApp channel enabled
- [ ] Widget ID in `.env.local` matches widget "code"
- [ ] Phone number format: `919899999999` (no +, no spaces)
- [ ] Server logs show correct identifier format

## 🔍 What to Look For

### In Server Logs:
```
[MSG91] Identifier: 919899999999  ← Should match manual test format
[MSG91] Request body: { "widgetId": "...", "identifier": "919899999999" }
```

### In MSG91 Dashboard Logs:
- **From**: `919646656715` (should match)
- **Template**: `code` (should match)
- **To**: `919899999999` (should match format)
- **Status**: Delivered/Failed (check this)

## 🆘 If Widget Still Doesn't Work

### Option 1: Use Direct OTP API (Not Widget)

If widget continues to fail, use direct OTP API:

```typescript
// Instead of widget API, use direct OTP API
// This gives you more control
POST https://api.msg91.com/api/v5/otp/send
```

### Option 2: Create New Widget

1. Create a new widget
2. Configure exactly like manual test:
   - Same WhatsApp number
   - Same template
   - Same settings
3. Test with new widget

### Option 3: Contact MSG91 Support

Provide:
- Widget ID
- Manual test works (screenshot)
- Widget test fails (logs)
- Request comparison

---

## 📝 Next Steps

1. **Check widget settings** match manual test exactly
2. **Compare logs** between widget and manual test
3. **Verify phone format** in server logs
4. **Test again** with aligned settings

**Key**: Since manual test works, the widget just needs to be configured the same way!

