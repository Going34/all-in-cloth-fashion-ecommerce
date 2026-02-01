# MSG91 OTP API Troubleshooting Guide

## HTTP 401 Error: Authentication Failed

If you're getting `"MSG91 send OTP failed (HTTP 401)"`, follow these steps:

### 1. Verify MSG91_AUTH_KEY Environment Variable

**Check if the key is set:**
```bash
# In your terminal
echo $MSG91_AUTH_KEY

# Or check .env.local file
cat .env.local | grep MSG91_AUTH_KEY
```

**Ensure it's in `.env.local`:**
```env
MSG91_AUTH_KEY=your-actual-authkey-here
```

**Restart your dev server** after adding/updating the env variable:
```bash
npm run dev
```

---

### 2. Verify Authkey in MSG91 Dashboard

1. **Login to MSG91 Dashboard**: https://control.msg91.com/
2. **Go to**: Settings → API → Authentication Key
3. **Verify**:
   - Your authkey matches what's in `.env.local`
   - The authkey is **Active/Enabled** (not disabled)
   - The authkey has **OTP service enabled**

---

### 3. Enable OTP Service for Your Authkey

1. **In MSG91 Dashboard**: Go to **Settings → API → Authentication Key**
2. **Click on your authkey** to edit
3. **Check "OTP" service** is enabled/ticked
4. **Save changes**

**Note**: Some MSG91 accounts require separate activation for OTP service. Contact MSG91 support if OTP option is not visible.

---

### 4. Check IP Whitelist Restrictions

If your MSG91 account has **IP whitelist** enabled:

1. **In MSG91 Dashboard**: Go to **Settings → API → IP Whitelist**
2. **Add your server's IP address**:
   - For local development: Your public IP (check at https://whatismyipaddress.com/)
   - For production: Your server's public IP
3. **Or disable IP whitelist** (if not needed for security)

**Common Issue**: If IP whitelist is enabled but your IP isn't added, all API calls will return 401.

---

### 5. Verify Account Status

1. **Check account activation**:
   - Login to MSG91 Dashboard
   - Ensure account is **verified and active**
   - Check for any account restrictions or suspensions

2. **Check OTP service activation**:
   - Some accounts require manual activation of OTP service
   - Contact MSG91 support if OTP service is not available

---

### 6. Verify API Endpoint and Request Format

**Current Implementation:**
- **Endpoint**: `POST https://api.msg91.com/api/v5/otp/send`
- **Headers**: 
  - `Content-Type: application/json`
  - `authkey: YOUR_AUTH_KEY`
- **Body**:
  ```json
  {
    "country_code": "91",
    "phone_number": "9999999999",
    "company": "All in Cloth"
  }
  ```

**Verify in MSG91 Dashboard**:
- Go to **API Documentation** → **OTP** → **Send OTP**
- Ensure the endpoint format matches

---

### 7. Test with MSG91 API Testing Tool

**Use MSG91's built-in API tester**:
1. Login to MSG91 Dashboard
2. Go to **API** → **Test API** or **API Playground**
3. Select **OTP** → **Send OTP**
4. Enter:
   - Your authkey
   - Test phone number
   - Country code
5. **Click "Send"** and check if it works

If it works in the dashboard but not in your code, the issue is likely:
- Environment variable not loaded
- IP whitelist restriction
- Different authkey being used

---

### 8. Check MSG91 Account Type

**Free/Trial Accounts**:
- May have restrictions on OTP service
- May require account upgrade
- May have daily/monthly limits

**Paid Accounts**:
- Should have full OTP access
- Check if payment is up to date

---

### 9. Common MSG91 Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid authkey" | Wrong or expired key | Verify key in dashboard |
| "OTP service not enabled" | Service not activated | Enable in dashboard |
| "IP not whitelisted" | IP restriction | Add IP to whitelist |
| "Account suspended" | Account issue | Contact MSG91 support |
| "Insufficient balance" | No credits | Add credits to account |

---

### 10. Debug Steps

**Add logging to see exact error:**

The code now captures MSG91's full error response. Check your server logs or API response for:
- Exact error message from MSG91
- Response body details
- Status code and status text

**Example debug output:**
```json
{
  "success": false,
  "error": {
    "message": "MSG91 Authentication Failed (401): Invalid authkey. Check: 1) MSG91_AUTH_KEY is correct...",
    "code": "INTERNAL_ERROR"
  }
}
```

---

### 11. Contact MSG91 Support

If none of the above works:

1. **MSG91 Support**: support@msg91.com
2. **Provide**:
   - Your authkey (first 10 chars only for security)
   - Error message and status code
   - Account email/ID
   - API endpoint you're using
   - Request format

---

## Quick Checklist

- [ ] `MSG91_AUTH_KEY` is set in `.env.local`
- [ ] Dev server restarted after adding env variable
- [ ] Authkey is active in MSG91 dashboard
- [ ] OTP service is enabled for the authkey
- [ ] IP whitelist is disabled OR your IP is whitelisted
- [ ] Account is verified and active
- [ ] Tested in MSG91 dashboard API tester
- [ ] Account has sufficient credits/balance

---

## Alternative: Use MSG91 Widget API

If the direct OTP API continues to fail, consider using MSG91's **Widget API** which may have different authentication:

**Widget API Endpoint**: `POST https://api.msg91.com/api/v5/widget/sendOtp`

**Required**:
- `widgetId` (created in MSG91 dashboard)
- `authkey` (same or different)

**Note**: Widget API requires creating a widget in MSG91 dashboard first.

---

## Still Having Issues?

1. **Check server logs** for the full MSG91 error response
2. **Test with curl** to isolate the issue:
   ```bash
   curl -X POST https://api.msg91.com/api/v5/otp/send \
     -H "Content-Type: application/json" \
     -H "authkey: YOUR_AUTH_KEY" \
     -d '{"country_code":"91","phone_number":"9999999999","company":"Test"}'
   ```
3. **Compare** with MSG91 dashboard API tester results
4. **Contact MSG91 support** with specific error details



