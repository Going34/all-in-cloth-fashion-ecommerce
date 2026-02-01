# MSG91 WhatsApp OTP - Quick Start Guide

## ✅ Pre-Setup Checklist

Before you start, make sure you have:

```
□ MSG91 account created (msg91.com)
□ WhatsApp Business Account connected to MSG91
□ Next.js project (v13+)
□ Node.js 16+
□ Code editor (VS Code recommended)
```

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: MSG91 Configuration (2 min)

1. **Get Auth Key:**
   ```
   MSG91 Dashboard → Settings → API → REST API Key
   Copy it
   ```

2. **Create/Check WhatsApp Template:**
   ```
   MSG91 Dashboard → Send WhatsApp → Templates
   
   Create template (if not exists):
   - Name: code
   - Category: AUTHENTICATION ⭐ (CRITICAL!)
   - Language: English
   - Body: Here is the code. For your recent request: {{1}}. Thank you you
   
   Status: Must show ✅ Approved
   ```

3. **Get Widget ID:**
   ```
   MSG91 Dashboard → OTP → Widget/SDK
   Create widget named "code" if not exists
   Copy the Widget ID
   ```

### Step 2: Next.js Setup (2 min)

1. **Install Dependencies:**
   ```bash
   npm install axios
   ```

2. **Create `.env.local`:**
   ```bash
   MSG91_AUTH_KEY=your_key_here
   MSG91_WIDGET_ID=your_widget_id_here
   ```

3. **Create folder structure:**
   ```bash
   mkdir -p pages/api/auth
   mkdir -p components
   ```

### Step 3: Copy Files (1 min)

Copy these files to your project:

```
pages/api/auth/send-otp.js        → API route for sending OTP
pages/api/auth/verify-otp.js      → API route for verifying OTP
pages/login.jsx                   → Login page
components/VerifyOTP.jsx          → OTP verification component
```

---

## 🧪 Testing (2 Minutes)

### Test Step 1: Start Server
```bash
npm run dev
```

### Test Step 2: Go to Login
```
http://localhost:3000/login
```

### Test Step 3: Enter Phone Number
```
Country: India (+91)
Phone: Your 10-digit number (e.g., 9876543210)
```

### Test Step 4: Send OTP
```
Click "Send OTP via WhatsApp"
Check console: Should show [MSG91] ✅ OTP Sent Successfully
```

### Test Step 5: Check WhatsApp
```
Wait 5-10 seconds
You should receive a message:
"Here is the code. For your recent request: 123456. Thank you you"
```

### Test Step 6: Verify
```
Enter the 6-digit code from WhatsApp
Click "Verify Code"
You should be redirected to /dashboard
```

---

## 📁 Project Structure After Setup

```
your-nextjs-app/
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── send-otp.js
│   │       └── verify-otp.js
│   ├── login.jsx
│   └── dashboard.jsx (or wherever you want to redirect)
├── components/
│   └── VerifyOTP.jsx
├── .env.local
└── package.json
```

---

## 🔧 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| OTP not received | Check template category is AUTHENTICATION |
| API returns 500 | Check environment variables in `.env.local` |
| Phone format error | Remove country code, use only 10 digits |
| OTP already sent? | Wait 15+ seconds or request new one |
| Can't find Widget ID | Create widget in OTP → Widget/SDK first |

---

## 📚 File Descriptions

### `send-otp.js`
- Handles POST `/api/auth/send-otp`
- Takes: `{ phone, countryCode }`
- Returns: `{ success, message, requestId }`
- Sends OTP via MSG91 Widget API

### `verify-otp.js`
- Handles POST `/api/auth/verify-otp`
- Takes: `{ phone, countryCode, otp }`
- Returns: `{ success, message }`
- Verifies OTP with MSG91

### `login.jsx`
- Login page component
- Phone input form
- Integrates OTP verification
- Handles resending OTP

### `VerifyOTP.jsx`
- OTP input component
- 6-digit input with visual display
- Timer (15 minutes expiry)
- Resend functionality (30 sec cooldown)

---

## 🔐 Security Considerations

Add these for production:

1. **Rate Limiting:**
   ```javascript
   // Limit OTP requests per IP
   // Limit verification attempts per phone
   ```

2. **Phone Verification:**
   ```javascript
   // Store phone in database
   // Track OTP attempts
   // Lock account after 5 failed attempts
   ```

3. **Session Management:**
   ```javascript
   // Create JWT after verification
   // Set secure HTTP-only cookies
   // Implement logout
   ```

4. **Environment Variables:**
   ```bash
   # Don't commit .env.local
   # Use .gitignore:
   .env.local
   .env.*.local
   ```

---

## 🚀 Next Steps

After basic setup works:

1. **Add User Creation:**
   ```javascript
   // In verify-otp.js after verification
   // Create user in database
   // Generate JWT token
   ```

2. **Add Database:**
   ```javascript
   // Store phone numbers
   // Store OTP attempts
   // Store user accounts
   ```

3. **Add Session:**
   ```javascript
   // Use next-auth or similar
   // Handle user state
   // Implement logout
   ```

4. **Add Monitoring:**
   ```javascript
   // Log all OTP events
   // Monitor delivery rates
   // Set up error alerts
   ```

---

## 📞 Support

If issues persist:

1. **Check MSG91 Logs:**
   ```
   Dashboard → OTP → Widget/SDK → Logs
   Look for your test phone number
   ```

2. **Check Browser Console:**
   ```
   F12 → Console tab
   Look for error messages and logs
   ```

3. **Check Server Console:**
   ```
   Terminal running "npm run dev"
   Look for [MSG91] logs
   ```

4. **Verify Template:**
   ```
   Dashboard → Send WhatsApp → Templates → code
   Confirm:
   - Status: Approved ✅
   - Category: AUTHENTICATION ✅
   ```

---

## ✨ Done!

You now have:
- ✅ WhatsApp OTP authentication
- ✅ Login page with phone input
- ✅ OTP verification flow
- ✅ API routes for send/verify
- ✅ Responsive UI with timers

**Start at:** `/login`

**Test it now!** 🎉

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for errors
npm run lint
```

---

## Tips

- 💡 Test with your own phone number first
- 💡 Check WhatsApp spam/junk folder if no message
- 💡 OTP codes expire after 15 minutes
- 💡 Resend is disabled for 30 seconds
- 💡 Each API call is logged with [MSG91] prefix
- 💡 Check environment variables if API fails

---

## Demo Flow

```
User opens /login
  ↓
Enters phone number
  ↓
Clicks "Send OTP via WhatsApp"
  ↓
API sends to MSG91
  ↓
MSG91 sends to WhatsApp
  ↓
User receives code (e.g., 123456)
  ↓
User enters code
  ↓
Clicks "Verify Code"
  ↓
API verifies with MSG91
  ↓
Redirects to /dashboard
  ↓
User logged in! ✅
```

---

## Need More Help?

- Read: `MSG91_Complete_Implementation_Guide.md`
- Check: MSG91 API documentation
- Debug: `msg91-diagnostic.js` script
- Review: `WHATSAPP_TEMPLATE_CATEGORY_FIX.md`
