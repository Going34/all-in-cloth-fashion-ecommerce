# MSG91 OTP API Implementation Verification

## Documentation Reference
Based on MSG91 official documentation from [docs.msg91.com](https://docs.msg91.com)

## Implementation Comparison

### ✅ Send OTP API

**Documentation Format:**
```javascript
POST https://api.msg91.com/api/v5/otp/send
Headers:
  Content-Type: application/json
  authkey: YOUR_AUTH_KEY
Body:
  {
    "country_code": "91",
    "phone_number": "9999999999",
    "company": "Your Company Name",
    "otp": "optional - auto-generated if not provided"
  }
```

**Our Implementation:**
```typescript
POST https://api.msg91.com/api/v5/otp/send
Headers:
  Content-Type: application/json
  authkey: process.env.MSG91_AUTH_KEY
Body:
  {
    country_code: "91" (normalized),
    phone_number: "9999999999" (digits only),
    company: "All in Cloth" (default)
  }
```

**Status:** ✅ **CORRECT** - Matches documentation format

---

### ✅ Verify OTP API

**Documentation Format:**
```javascript
GET https://control.msg91.com/api/v5/otp/verify?otp=123456&mobile=919999999999
Headers:
  authkey: YOUR_AUTH_KEY
```

**Our Implementation:**
```typescript
GET https://control.msg91.com/api/v5/otp/verify?otp={otp}&mobile={countryCode}{phoneNumber}
Headers:
  authkey: process.env.MSG91_AUTH_KEY
```

**Status:** ✅ **CORRECT** - Matches documentation format

---

## Key Findings

### 1. Endpoint URLs
- **Send OTP**: `https://api.msg91.com/api/v5/otp/send` ✅
- **Verify OTP**: `https://control.msg91.com/api/v5/otp/verify` ✅
- Note: Different base domains (`api.msg91.com` vs `control.msg91.com`) - this is correct per MSG91 docs

### 2. Header Format
- Header name must be lowercase: `authkey` (not `AuthKey` or `AUTHKEY`)
- Our implementation uses: `'authkey': authkey` ✅

### 3. Request Body Format
- `country_code`: String of digits (e.g., "91")
- `phone_number`: String of digits only (no +, spaces, or dashes)
- `company`: Optional string
- `otp`: Optional - MSG91 auto-generates if not provided

### 4. Phone Number Format
- **For Send OTP**: Send as separate `country_code` and `phone_number` fields
- **For Verify OTP**: Combine as `{countryCode}{phoneNumber}` (e.g., "919999999999")
- Our normalization functions handle this correctly ✅

---

## Common 401 Error Causes

Based on MSG91 documentation and common issues:

### 1. Invalid Authkey
- **Check**: Authkey matches exactly what's in MSG91 dashboard
- **Location**: MSG91 Dashboard → Settings → API → Authentication Key
- **Fix**: Copy the exact authkey (no extra spaces, correct case)

### 2. OTP Service Not Enabled
- **Check**: In authkey settings, ensure "OTP" service is enabled
- **Location**: MSG91 Dashboard → Settings → API → Authentication Key → Edit
- **Fix**: Enable OTP service checkbox

### 3. IP Whitelist Restriction
- **Check**: If IP whitelist is enabled, your server IP must be added
- **Location**: MSG91 Dashboard → Settings → API → IP Whitelist
- **Fix**: Add your server's public IP or disable whitelist

### 4. Account Status
- **Check**: Account is verified and active
- **Location**: MSG91 Dashboard → Account Settings
- **Fix**: Verify account or contact MSG91 support

### 5. Authkey Format
- **Check**: Authkey is the correct format (usually alphanumeric, ~30-40 chars)
- **Example**: `487822AHZo9fNW8n8696675f7P1`
- **Fix**: Ensure no extra characters, spaces, or line breaks

---

## Testing the Implementation

### Option 1: Use Test Script
```bash
cd e-commerce
npx tsx scripts/test-msg91-otp.ts
```

### Option 2: Manual cURL Test
```bash
curl -X POST https://api.msg91.com/api/v5/otp/send \
  -H "Content-Type: application/json" \
  -H "authkey: YOUR_AUTH_KEY" \
  -d '{
    "country_code": "91",
    "phone_number": "9999999999",
    "company": "Test Company"
  }'
```

### Option 3: MSG91 Dashboard API Tester
1. Login to MSG91 Dashboard
2. Go to: API → Test API → OTP → Send OTP
3. Enter your authkey and test phone number
4. Compare results with your implementation

---

## Implementation Recommendations

### ✅ Current Implementation is Correct
The code matches MSG91 documentation format exactly. The 401 error is likely due to:

1. **Authkey Configuration** (most common)
   - Verify authkey in MSG91 dashboard
   - Ensure OTP service is enabled
   - Check for IP whitelist restrictions

2. **Environment Variable**
   - Ensure `MSG91_AUTH_KEY` is set correctly
   - Restart dev server after setting env variable
   - Check for typos or extra spaces

3. **Account Status**
   - Verify MSG91 account is active
   - Check for account restrictions
   - Ensure sufficient credits/balance

---

## Next Steps for Debugging

1. **Run Test Script**:
   ```bash
   npx tsx scripts/test-msg91-otp.ts
   ```
   This will show the exact request/response and help identify the issue.

2. **Check MSG91 Dashboard**:
   - Verify authkey is active
   - Enable OTP service
   - Check IP whitelist
   - Test in dashboard API tester

3. **Compare Responses**:
   - Test in MSG91 dashboard API tester
   - Compare with your implementation
   - Check for any differences in request format

4. **Contact MSG91 Support**:
   - If all above checks pass, contact MSG91 support
   - Provide: authkey (first 10 chars), error message, account email

---

## Code Quality Notes

✅ **Good Practices Implemented**:
- Proper error handling with detailed messages
- Phone number normalization
- Country code normalization
- Type-safe TypeScript implementation
- Server-only module (prevents client-side exposure)

✅ **Documentation**:
- Code comments reference MSG91 docs
- Clear function signatures
- Proper error messages

---

## References

- MSG91 OTP Documentation: https://docs.msg91.com/otp
- MSG91 API Reference: https://docs.msg91.com/
- MSG91 Dashboard: https://control.msg91.com/



