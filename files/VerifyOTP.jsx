// components/VerifyOTP.jsx
// OTP Verification Component

import { useState, useEffect } from 'react';

export default function VerifyOTPComponent({
  onSuccess,
  onBack,
  otpSentTime,
  onResend
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimeLeft, setResendTimeLeft] = useState(30);

  // OTP expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return;

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
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimeLeft <= 0) {
      setResendDisabled(false);
      return;
    }

    const timer = setInterval(() => {
      setResendTimeLeft(prev => {
        if (prev <= 1) {
          setResendDisabled(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimeLeft]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate OTP
    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const phoneData = JSON.parse(sessionStorage.getItem('verifyPhone'));

      console.log('[VERIFY] Verifying OTP:', {
        phone: phoneData.phone,
        otp: '***' + otp.slice(-3)
      });

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneData.phone,
          countryCode: phoneData.countryCode,
          otp: otp
        })
      });

      const data = await response.json();
      console.log('[VERIFY] Response:', data);

      if (data.success) {
        console.log('[VERIFY] ✅ OTP verified successfully');
        onSuccess();
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('[VERIFY] Error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    // Only allow numbers, max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(''); // Clear error when user types
  };

  const handleResend = async () => {
    setResendTimeLeft(30);
    setResendDisabled(true);
    setError('');
    setOtp('');

    // Call the resend function from parent
    if (onResend) {
      onResend();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const phoneData = typeof window !== 'undefined'
    ? JSON.parse(sessionStorage.getItem('verifyPhone') || '{}')
    : {};

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={onBack}
          style={styles.backButton}
          type="button"
        >
          ← Change Phone
        </button>
        <h2 style={styles.title}>Enter Code</h2>
        <p style={styles.subtitle}>
          We sent a 6-digit code to{' '}
          <strong>+{phoneData.countryCode}{phoneData.phone}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleVerifyOTP} style={styles.form}>
        {/* OTP Input */}
        <div style={styles.otpInputWrapper}>
          <input
            type="text"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            maxLength="6"
            style={styles.otpInput}
            autoFocus
            required
            disabled={loading || timeLeft === 0}
          />
          <div style={styles.otpDisplay}>
            {otp.split('').map((digit, i) => (
              <div key={i} style={styles.otpDigit}>
                {digit}
              </div>
            ))}
            {otp.length < 6 &&
              Array(6 - otp.length)
                .fill(null)
                .map((_, i) => (
                  <div key={'empty-' + i} style={styles.otpDigitEmpty}></div>
                ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Timer */}
        <div style={styles.timerBox}>
          {timeLeft > 0 ? (
            <>
              <span>⏱️ Code expires in:</span>
              <strong>{formatTime(timeLeft)}</strong>
            </>
          ) : (
            <>
              <span>⚠️ Code expired</span>
              <button
                type="button"
                onClick={handleResend}
                style={styles.resendLink}
              >
                Request new code
              </button>
            </>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading || otp.length !== 6 || timeLeft === 0}
          style={{
            ...styles.button,
            ...styles.verifyButton,
            opacity: loading || otp.length !== 6 || timeLeft === 0 ? 0.6 : 1,
            cursor:
              loading || otp.length !== 6 || timeLeft === 0
                ? 'not-allowed'
                : 'pointer'
          }}
        >
          {loading ? (
            <>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Verifying...
            </>
          ) : (
            <>
              <span style={{ marginRight: '8px' }}>✓</span>
              Verify Code
            </>
          )}
        </button>

        {/* Resend Option */}
        <div style={styles.resendBox}>
          <p style={styles.resendText}>Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            style={{
              ...styles.resendButton,
              opacity: resendDisabled ? 0.5 : 1,
              cursor: resendDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {resendDisabled ? (
              <>
                Resend in {resendTimeLeft}s
              </>
            ) : (
              <>
                📱 Resend Code
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info */}
      <div style={styles.infoBox}>
        <p>
          💡 Check your WhatsApp inbox and junk folder. The code will arrive
          within a few seconds.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    marginBottom: '25px',
    textAlign: 'center'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#25D366',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0',
    marginBottom: '15px',
    textDecoration: 'none'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  otpInputWrapper: {
    marginBottom: '20px'
  },
  otpInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '24px',
    textAlign: 'center',
    letterSpacing: '10px',
    fontWeight: 'bold',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  otpDisplay: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center'
  },
  otpDigit: {
    width: '45px',
    height: '55px',
    border: '2px solid #25D366',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    backgroundColor: '#F0F9F7'
  },
  otpDigitEmpty: {
    width: '45px',
    height: '55px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  errorBox: {
    display: 'flex',
    gap: '10px',
    padding: '12px 15px',
    backgroundColor: '#FFE0E0',
    border: '1px solid #FFB3B3',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#D32F2F'
  },
  timerBox: {
    padding: '12px 15px',
    backgroundColor: '#FFF3E0',
    border: '1px solid #FFE0B2',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#E65100',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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
  verifyButton: {
    backgroundColor: '#25D366',
    color: 'white',
    marginBottom: '15px'
  },
  resendBox: {
    padding: '15px',
    backgroundColor: '#F5F5F5',
    borderRadius: '8px',
    textAlign: 'center'
  },
  resendText: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    color: '#666'
  },
  resendButton: {
    background: 'none',
    border: '2px solid #25D366',
    color: '#25D366',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  resendLink: {
    background: 'none',
    border: 'none',
    color: '#25D366',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '0',
    textDecoration: 'underline'
  },
  infoBox: {
    padding: '12px 15px',
    backgroundColor: '#E3F2FD',
    border: '1px solid #BBDEFB',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1565C0',
    marginTop: '15px'
  }
};
