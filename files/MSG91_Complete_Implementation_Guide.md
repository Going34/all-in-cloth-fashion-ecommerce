# MSG91 WhatsApp OTP Implementation Guide for Next.js

Complete step-by-step guide to implement WhatsApp OTP authentication in your Next.js application.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [MSG91 Setup](#msg91-setup)
3. [Next.js Implementation](#nextjs-implementation)
4. [API Routes](#api-routes)
5. [Frontend Implementation](#frontend-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need
- MSG91 account (create at https://msg91.com)
- Next.js app (v13+ recommended)
- Environment variables set up
- Phone number in format: country code + number (e.g., 919876543210)

### Install Dependencies
```bash
npm install axios dotenv
```

---

## MSG91 Setup

### Step 1: Get Your Auth Key

1. Log in to MSG91 Dashboard
2. Go to **Settings → API → REST API Key**
3. Copy your authentication key
4. Save it as `MSG91_AUTH_KEY` in your `.env.local`

### Step 2: Create WhatsApp Template

**CRITICAL: Template Category Must Be AUTHENTICATION**

1. Go to **Send WhatsApp → Templates**
2. Click **Create Template**
3. Fill in the form:
   ```
   Template Name: code
   Category: AUTHENTICATION ⚠️ (NOT UTILITY)
   Language: English
   Body: Here is the code. For your recent request: {{1}}. Thank you you
   Variable 1: Type = OTP, Name = code
   ```
4. Submit for approval
5. Wait for WhatsApp approval (usually 1-5 minutes)

### Step 3: Verify Template is Approved

```
Dashboard → Send WhatsApp → Templates → code
Status should show: ✅ Approved
Category should show: ✅ AUTHENTICATION
```

### Step 4: Get Widget ID (for Widget API)

If using Widget API:
1. Go to **OTP → Widget/SDK**
2. Click **Create Widget** (if not exists)
3. Name it "code"
4. Select template "code"
5. Copy the **Widget ID**
6. Save as `MSG91_WIDGET_ID` in `.env.local`

### Step 5: Set Environment Variables

Create `.env.local`:
```bash
MSG91_AUTH_KEY=your_auth_key_here
MSG91_WIDGET_ID=your_widget_id_here
MSG91_WHATSAPP_NUMBER=919646656715
```

---

## Next.js Implementation

### Project Structure

```
your-app/
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── send-otp.js
│   │       └── verify-otp.js
│   ├── login.jsx
│   └── verify.jsx
├── lib/
│   ├── msg91.js
│   └── otp-storage.js
├── .env.local
└── package.json
```

---

## API Routes

### 1. Send OTP API (`pages/api/auth/send-otp.js`)

```javascript
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, countryCode = '91' } = req.body;

  // Validation
  if (!phone || phone.length < 10) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid phone number' 
    });
  }

  try {
    // Format phone number
    const formattedPhone = `${countryCode}${phone}`.replace(/^\+/, '');
    
    console.log(`[MSG91] Sending OTP to: ${formattedPhone}`);

    // Use Widget API (Recommended)
    const response = await axios.post(
      'https://api.msg91.com/apiv5/otp/send',
      {
        widgetId: process.env.MSG91_WIDGET_ID,
        identifier: formattedPhone
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[MSG91] Response:`, response.data);

    if (response.data.type === 'success') {
      // Store phone number temporarily (you might use Redis or database)
      // For now, we'll return success
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        requestId: response.data.message,
        phone: formattedPhone
      });
    } else {
      throw new Error(response.data.message || 'Failed to send OTP');
    }

  } catch (error) {
    console.error('[MSG91] Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
}
```

### 2. Verify OTP API (`pages/api/auth/verify-otp.js`)

```javascript
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, countryCode = '91', otp } = req.body;

  // Validation
  if (!phone || !otp || otp.length !== 6) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone or OTP'
    });
  }

  try {
    const formattedPhone = `${countryCode}${phone}`.replace(/^\+/, '');

    console.log(`[MSG91] Verifying OTP for: ${formattedPhone}`);

    // Verify OTP using MSG91 API
    const response = await axios.post(
      'https://api.msg91.com/apiv5/otp/verify',
      {
        mobile: formattedPhone,
        otp: otp
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[MSG91] Verify Response:', response.data);

    if (response.data.type === 'success') {
      // OTP verified successfully
      // Now you can:
      // 1. Create user account
      // 2. Set session/JWT token
      // 3. Redirect to dashboard
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        phone: formattedPhone
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('[MSG91] Verify Error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || 'Verification failed'
    });
  }
}
```

### Alternative: Direct Send API (Without Widget)

If you don't want to use Widget API:

```javascript
// pages/api/auth/send-otp-direct.js
const response = await axios.post(
  'https://api.msg91.com/apiv5/otp/send',
  {
    template: 'code',
    mobile: formattedPhone,
    country_code: countryCode,
    otp_length: 6,
    otp_expiry: 15 // minutes
  },
  {
    headers: {
      authkey: process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json'
    }
  }
);
```

---

## Frontend Implementation

### 1. Login Page (`pages/login.jsx`)

```jsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/^\+/, ''),
          countryCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store phone in session storage for verification
        sessionStorage.setItem('verifyPhone', JSON.stringify({
          phone: data.phone,
          countryCode
        }));
        setShowOtpInput(true);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
  };

  return (
    <div className="login-container" style={styles.container}>
      <h1 style={styles.heading}>Sign In with OTP</h1>

      {!showOtpInput ? (
        <form onSubmit={handleSendOTP} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={styles.phoneInput}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={styles.select}
              >
                <option value="91">+91 (India)</option>
                <option value="1">+1 (USA)</option>
                <option value="44">+44 (UK)</option>
                <option value="61">+61 (Australia)</option>
              </select>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="10 digit number"
                maxLength="10"
                style={styles.input}
                required
              />
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            style={{
              ...styles.button,
              opacity: loading || phone.length < 10 ? 0.5 : 1
            }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <p style={styles.info}>
            📱 You'll receive a 6-digit code on WhatsApp
          </p>
        </form>
      ) : (
        <VerifyOTPComponent
          onSuccess={() => router.push('/dashboard')}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif'
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold'
  },
  phoneInput: {
    display: 'flex',
    gap: '10px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100px'
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    backgroundColor: '#25D366',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: {
    color: 'red',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#ffe0e0',
    borderRadius: '4px'
  },
  info: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#666'
  }
};
```

### 2. OTP Verification Component (`pages/verify.jsx` or inline)

```jsx
import { useState, useEffect } from 'react';

function VerifyOTPComponent({ onSuccess }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const phoneData = JSON.parse(sessionStorage.getItem('verifyPhone'));
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneData.phone.replace(/^\+/, '').slice(-10),
          countryCode: phoneData.countryCode,
          otp
        })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem('verifyPhone');
        onSuccess();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Enter OTP
      </h2>

      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
        Check your WhatsApp for the 6-digit code
      </p>

      <form onSubmit={handleVerifyOTP}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            maxLength="6"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '10px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
            autoFocus
            required
          />
        </div>

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe0e0',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.length !== 6 || timeLeft === 0}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: otp.length === 6 ? '#25D366' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: otp.length === 6 ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
          OTP expires in: <strong>{formatTime(timeLeft)}</strong>
        </p>

        {timeLeft === 0 && (
          <p style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>
            OTP Expired. Please request a new one.
          </p>
        )}
      </form>
    </div>
  );
}

export default VerifyOTPComponent;
```

---

## Testing

### Test the Flow

1. **Start your Next.js app:**
   ```bash
   npm run dev
   ```

2. **Go to login page:**
   ```
   http://localhost:3000/login
   ```

3. **Enter a test phone number:**
   - Your own number (to test with)
   - Format: Without country code (e.g., 9876543210 for +91 9876543210)

4. **Check console logs:**
   ```
   [MSG91] Sending OTP to: 919876543210
   [MSG91] Response: {type: "success", message: "request_id_here"}
   ```

5. **Check WhatsApp:**
   - Wait 5-10 seconds
   - You should receive a message like:
     ```
     Here is the code. For your recent request: 123456. Thank you you
     ```

6. **Enter OTP:**
   - Type the 6-digit code in the input
   - Click "Verify OTP"

7. **Check verification logs:**
   ```
   [MSG91] Verifying OTP for: 919876543210
   [MSG91] Verify Response: {type: "success"}
   ```

### Common Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| Valid phone + correct OTP | ✅ Login successful |
| Valid phone + wrong OTP | ❌ "Invalid OTP" error |
| Invalid phone | ❌ "Invalid phone" error |
| No OTP received | Check: template approved? Demo mode off? |
| OTP received but can't verify | Check: Correct OTP typed? Within 15 min? |

---

## Troubleshooting

### Issue: OTP Not Received

**Check these in order:**

1. **Template Category:**
   ```
   Dashboard → Send WhatsApp → Templates → code
   Category MUST be: AUTHENTICATION (not UTILITY)
   ```

2. **Template Status:**
   ```
   Status MUST be: Approved
   If status is "Pending", wait 5 minutes
   If status is "Rejected", check rejection reason
   ```

3. **Phone Format:**
   ```
   Correct: 919876543210 (country code + number)
   Wrong: 9876543210 (missing country code)
   Wrong: +919876543210 (has + sign)
   ```

4. **API Response:**
   ```javascript
   Look for: {type: "success", message: "request_id"}
   If error, check environment variables
   ```

5. **MSG91 Logs:**
   ```
   Dashboard → OTP → Widget/SDK → Logs
   New entry should appear within 5-10 seconds
   Host column should be populated
   ```

### Issue: "Access token unverified"

**Solution:**
```
Dashboard → Settings → WhatsApp Business Account
Check: Status shows "Connected"
If not, click "Connect" and follow steps
```

### Issue: Template Shows as Utility Instead of Authentication

**Solution:**
```
1. Go to Send WhatsApp → Templates
2. Click Edit on "code"
3. Change Category dropdown to "AUTHENTICATION"
4. Save and wait for re-approval
5. Verify it changed by refreshing page
```

### Issue: API Returns 500 Error

**Check:**
1. Environment variables set correctly:
   ```bash
   echo $MSG91_AUTH_KEY
   echo $MSG91_WIDGET_ID
   ```

2. Auth key is valid (not expired)

3. Check server logs for error details

### Issue: OTP Expires Too Quickly

**Solution:**
```javascript
// In send-otp.js, add expiry parameter:
{
  widgetId: process.env.MSG91_WIDGET_ID,
  identifier: formattedPhone,
  otpExpiry: 15 // minutes (default: 15)
}
```

### Issue: Widget ID Not Found

**Solution:**
1. If no widget exists, create one:
   ```
   Dashboard → OTP → Widget/SDK → Create Widget
   ```
2. Copy the ID shown
3. Add to `.env.local` as `MSG91_WIDGET_ID`
4. Restart Next.js server

---

## Production Checklist

Before going live:

```
□ Template category is AUTHENTICATION
□ Template is APPROVED
□ Environment variables set in production
□ Both send and verify endpoints tested
□ Error handling implemented
□ Rate limiting added (to prevent abuse)
□ User feedback messages clear
□ OTP expiry time appropriate (15-30 min)
□ Phone validation working
□ Database storing user on successful verification
□ Session/JWT token created after verification
□ Monitor MSG91 logs for delivery patterns
□ Set up alerts for failed OTP deliveries
```

---

## Next Steps

1. **Add rate limiting** (to prevent OTP bombing):
   ```javascript
   // Use redis-rate-limit or similar
   const maxAttempts = 5; // per hour
   ```

2. **Store OTP attempts in database:**
   ```javascript
   // Track failed attempts
   // Lock account after 5 failed attempts
   ```

3. **Add user creation:**
   ```javascript
   // After OTP verified, create user in database
   ```

4. **Add session management:**
   ```javascript
   // Create JWT or session token
   // Redirect to dashboard
   ```

5. **Monitor and analytics:**
   ```javascript
   // Track OTP delivery rates
   // Track verification success rates
   // Set up error alerts
   ```

---

## Example: Complete Working Flow

```javascript
// 1. User enters phone → send-otp.js
// → MSG91 sends OTP via WhatsApp
// → User receives: "Here is the code. For your recent request: 123456. Thank you you"

// 2. User enters 6-digit code → verify-otp.js
// → Code verified with MSG91
// → User logged in
// → Redirect to dashboard
```

---

## Support

If you encounter issues:

1. Check MSG91 Dashboard → OTP → Widget/SDK → Logs
2. Verify template category is AUTHENTICATION
3. Check environment variables
4. Review browser console for errors
5. Check server logs for detailed errors
6. Contact MSG91 support with screenshot of logs

---

## Summary

✅ You now have:
- WhatsApp OTP setup on MSG91
- Next.js API routes for send/verify
- Frontend components for login flow
- Testing instructions
- Troubleshooting guide

🚀 Ready to implement? Start with the [MSG91 Setup](#msg91-setup) section!
