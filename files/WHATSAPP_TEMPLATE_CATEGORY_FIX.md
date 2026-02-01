# WhatsApp Template Category Fix - Complete Guide

## The Problem (Found!)

Your "code" template is set to **CATEGORY: UTILITY**

WhatsApp rejects OTP messages sent through UTILITY templates because OTP codes require the **AUTHENTICATION** category.

```
❌ WRONG: Category = UTILITY
✅ CORRECT: Category = AUTHENTICATION
```

---

## WhatsApp Template Categories Explained

### 1. **MARKETING**
- Use for: Promotional content, sales, announcements
- Examples: "Check our new sale!", "Download our app", "Special offer"
- Rate limits: Lower (more restricted)
- Use case: NOT for OTP

### 2. **UTILITY**
- Use for: Transactional messages, confirmations, updates
- Examples: "Your order #12345 shipped", "Invoice attached", "Account updated"
- Rate limits: Medium
- **Use case: NOT for OTP codes**

### 3. **AUTHENTICATION** ← **THIS IS YOUR FIX**
- Use for: OTP codes, verification codes, passwords, security alerts
- Examples: "Your verification code is 123456", "Security alert: new login", "Two-factor code: 654321"
- Rate limits: Highest (WhatsApp prioritizes these)
- **Use case: EXACTLY for OTP/codes**
- Special: Can use variables like `{{1}}` for the code placeholder

---

## Visual Comparison

```
Template: code
Purpose: Send OTP verification codes

WRONG Configuration:
┌─────────────────────────────┐
│ Name: code                  │
│ Category: UTILITY ❌        │
│ Body: {{1}} is your code    │
│ Status: Enabled             │
└─────────────────────────────┘
Result: WhatsApp rejects OTP messages

CORRECT Configuration:
┌─────────────────────────────┐
│ Name: code                  │
│ Category: AUTHENTICATION ✅ │
│ Body: {{1}} is your code    │
│ Status: Enabled             │
└─────────────────────────────┘
Result: OTP messages delivered successfully
```

---

## How to Change Template Category

### Method 1: Via MSG91 Dashboard (Recommended)

**Step 1: Navigate to Templates**
```
MSG91 Dashboard 
→ Send WhatsApp
→ Templates
```

**Step 2: Find and Edit Template**
```
Look for: "code" template
Click: Edit button (pencil icon)
```

**Step 3: Change Category**
```
Current Category: UTILITY
Change to: AUTHENTICATION
Click: Save/Update
```

**Step 4: Wait for Approval**
```
Status will update from "In Review" → "Approved"
Usually takes: Instant to 5 minutes
```

**Step 5: Verify Change**
```
Go back to Templates list
Confirm "code" now shows Category: AUTHENTICATION
```

### Method 2: Via API (Programmatic)

```javascript
// Update template category via API
const updateTemplateCategory = async (templateName) => {
  const response = await fetch(
    `https://api.msg91.com/apiv5/whatsapp/templates/${templateName}`,
    {
      method: "PUT",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category: "AUTHENTICATION" // Change this
      })
    }
  );
  
  const data = await response.json();
  return data;
};
```

---

## Step-by-Step Fix Process

### 1. Check Current State
```bash
# Current:
# Template: code
# Category: UTILITY ❌
# Delivery: FAILING

# After fix:
# Template: code  
# Category: AUTHENTICATION ✅
# Delivery: WORKING
```

### 2. Make the Change
```
Dashboard → Send WhatsApp → Templates → code → Edit
Category dropdown: Select "AUTHENTICATION"
Save
```

### 3. Verify the Change
```
Wait 1-5 minutes
Template status should show "Approved"
Check that Category column now shows "AUTHENTICATION"
```

### 4. Test OTP Delivery
```javascript
// Test API endpoint
POST /api/auth/send-otp
{
  "phone": "9876543210",
  "countryCode": "91"
}

// Expected:
// ✅ 200 response with success
// ✅ Message received in WhatsApp within 5-10 seconds
// ✅ OTP logs show entry with Host populated
```

---

## What Happens After Fix

### Before Category Change
```
User triggers OTP request
→ Your API calls MSG91 ✅
→ MSG91 accepts request ✅
→ MSG91 tries to send via template "code" ✅
→ WhatsApp receives message ✅
→ WhatsApp sees Category = UTILITY ❌
→ WhatsApp REJECTS (wrong category for OTP)
→ User: No message received ❌
→ Logs: Host column empty ❌
```

### After Category Change
```
User triggers OTP request
→ Your API calls MSG91 ✅
→ MSG91 accepts request ✅
→ MSG91 tries to send via template "code" ✅
→ WhatsApp receives message ✅
→ WhatsApp sees Category = AUTHENTICATION ✅
→ WhatsApp ACCEPTS and delivers ✅
→ User: Receives message in WhatsApp ✅
→ Logs: Host column populated ✅
```

---

## Verification Checklist

After making the change:

```
□ Logged into MSG91 Dashboard
□ Went to Send WhatsApp → Templates
□ Found template "code"
□ Clicked Edit
□ Changed Category from UTILITY to AUTHENTICATION
□ Clicked Save/Update
□ Waited for approval (1-5 minutes)
□ Refreshed templates page
□ Confirmed "code" template now shows "AUTHENTICATION"
□ Template status shows "Enabled" or "Approved"
□ Tested OTP delivery with new phone number
□ Checked OTP logs - Host column now populated
□ Received WhatsApp message with code
```

---

## FAQ

**Q: Will this affect my other templates?**
A: No. Only the "code" template changes. Other templates keep their categories.

**Q: How long does approval take?**
A: Usually instant (30 seconds to 5 minutes). Sometimes up to 24 hours for WhatsApp backend sync.

**Q: Can I have multiple OTP templates?**
A: Yes, but all for OTP must be AUTHENTICATION category.

**Q: What if I have "reference_code" and "otp" templates too?**
A: They should also be AUTHENTICATION category if they send codes/OTP.

**Q: Will existing failed OTPs work after I fix this?**
A: No, those are already rejected. But new OTPs will work.

**Q: What if changing category breaks something?**
A: Changing category only affects how WhatsApp processes new messages. Old messages unaffected.

**Q: Can I change back to UTILITY?**
A: Yes, but OTP delivery will fail again. Keep it as AUTHENTICATION.

---

## Double-Check: Your Current Templates

From your screenshot, you have:

```
1. code
   Category: UTILITY ❌ FIX THIS NOW
   Status: Enabled
   For: OTP delivery
   
2. reference_code
   Category: UTILITY (unclear if needed for OTP)
   Status: Enabled
   
3. otp
   Category: MARKETING ❌ ALSO WRONG
   Status: Enabled
```

**Recommendation:**

```
1. code
   Change to: AUTHENTICATION
   
2. reference_code
   Change to: AUTHENTICATION (if used for codes)
   
3. otp
   Change to: AUTHENTICATION (if used for OTP)
```

---

## What to Do Next

**Immediate (Right Now):**
1. ✅ Open MSG91 Dashboard
2. ✅ Go to Send WhatsApp → Templates
3. ✅ Edit "code" template
4. ✅ Change Category to "AUTHENTICATION"
5. ✅ Save

**Within 1-5 Minutes:**
1. ✅ Refresh templates page
2. ✅ Verify change took effect
3. ✅ Check template status

**Test (After Approval):**
1. ✅ Send test OTP to new number
2. ✅ Check OTP logs
3. ✅ Verify Host column is populated
4. ✅ Check WhatsApp for message

**Optional:**
1. ✅ Also fix "reference_code" and "otp" templates if used for codes
2. ✅ Monitor logs for successful deliveries

---

## Success Indicators

After fixing, you should see:

✅ In MSG91 Logs (OTP → Widget/SDK → Logs):
- Host column populated with WhatsApp info
- Verification showing checkmarks (or attempts)
- Resent count when user clicks resend

✅ In WhatsApp:
- Messages arrive within 5-10 seconds
- Message shows your code/OTP
- User can verify successfully

✅ In Your App:
- OTP verification flow completes
- Users successfully authenticate
- No timeout errors
