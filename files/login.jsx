// pages/login.jsx
// WhatsApp OTP Login Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import VerifyOTPComponent from '../components/VerifyOTP';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);

  const countryCodes = [
    { code: '91', name: '🇮🇳 India', flag: '+91' },
    { code: '1', name: '🇺🇸 USA', flag: '+1' },
    { code: '44', name: '🇬🇧 UK', flag: '+44' },
    { code: '61', name: '🇦🇺 Australia', flag: '+61' },
    { code: '971', name: '🇦🇪 UAE', flag: '+971' },
  ];

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (phone.length < 10) {
      setError('Phone number must be at least 10 digits');
      setLoading(false);
      return;
    }

    try {
      console.log(`[LOGIN] Sending OTP to: +${countryCode}${phone}`);

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          countryCode
        })
      });

      const data = await response.json();
      console.log(`[LOGIN] Send OTP Response:`, data);

      if (data.success) {
        console.log(`[LOGIN] OTP sent successfully`);
        
        // Store phone data for verification
        sessionStorage.setItem('verifyPhone', JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          countryCode,
          requestId: data.requestId
        }));

        setOtpSentTime(new Date());
        setShowOtpInput(true);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('[LOGIN] Error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
  };

  const handleResendOTP = async () => {
    // Allow resend after 30 seconds
    const now = new Date();
    const elapsed = (now - otpSentTime) / 1000;

    if (elapsed < 30) {
      setError(`Please wait ${Math.ceil(30 - elapsed)} seconds before resending`);
      return;
    }

    setShowOtpInput(false);
    setError('');
    setOtpSentTime(null);
  };

  const handleVerificationSuccess = async () => {
    console.log('[LOGIN] OTP verified successfully');
    
    // Clear session storage
    sessionStorage.removeItem('verifyPhone');

    // Redirect to dashboard or home
    router.push('/dashboard');
  };

  const handleBackToPhone = () => {
    setShowOtpInput(false);
    setOtpSentTime(null);
    setError('');
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoEmoji}>💬</span>
          </div>
          <h1 style={styles.title}>WhatsApp Login</h1>
          <p style={styles.subtitle}>
            Sign in with your phone number. We'll send you a code via WhatsApp.
          </p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {!showOtpInput ? (
            // Phone Input Form
            <form onSubmit={handleSendOTP} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <p style={styles.helperText}>
                  We'll send a code to this number via WhatsApp
                </p>

                <div style={styles.phoneInputWrapper}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={styles.countrySelect}
                  >
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="10 digit number"
                    maxLength="15"
                    style={styles.phoneInput}
                    autoFocus
                    required
                  />
                </div>

                <p style={styles.phoneFormat}>
                  {phone.length > 0 && (
                    <>
                      ✓ Full number: <strong>+{countryCode}{phone}</strong>
                    </>
                  )}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: loading || phone.length < 10 ? 0.6 : 1,
                  cursor: loading || phone.length < 10 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ marginRight: '8px' }}>⏳</span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>📱</span>
                    Send OTP via WhatsApp
                  </>
                )}
              </button>

              {/* Info Box */}
              <div style={styles.infoBox}>
                <p>
                  ℹ️ You'll receive a <strong>6-digit code</strong> in WhatsApp within a few seconds
                </p>
              </div>
            </form>
          ) : (
            // OTP Verification Component
            <VerifyOTPComponent
              onSuccess={handleVerificationSuccess}
              onBack={handleBackToPhone}
              otpSentTime={otpSentTime}
              onResend={handleResendOTP}
            />
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            🔒 Your data is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center'
  },
  logo: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  logoEmoji: {
    display: 'inline-block',
    animation: 'bounce 2s infinite'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 10px 0'
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '0'
  },
  content: {
    padding: '30px 20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroup: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  helperText: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 12px 0'
  },
  phoneInputWrapper: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  countrySelect: {
    padding: '12px 10px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    transition: 'border-color 0.3s'
  },
  phoneInput: {
    flex: 1,
    padding: '12px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
  },
  phoneFormat: {
    fontSize: '12px',
    color: '#666',
    margin: '8px 0 0 0',
    padding: '0'
  },
  errorBox: {
    display: 'flex',
    gap: '10px',
    padding: '12px 15px',
    backgroundColor: '#FFE0E0',
    border: '1px solid #FFB3B3',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#D32F2F'
  },
  button: {
    padding: '14px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#25D366',
    color: 'white',
    marginBottom: '15px'
  },
  infoBox: {
    padding: '15px',
    backgroundColor: '#E8F5E9',
    border: '1px solid #C8E6C9',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#2E7D32',
    margin: '0'
  },
  footer: {
    padding: '15px 20px',
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    borderTop: '1px solid #e0e0e0'
  },
  footerText: {
    margin: '0',
    fontSize: '12px',
    color: '#666'
  }
};
