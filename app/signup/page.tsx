'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, User, Sparkles, KeyRound, RefreshCw, Mail, Lock } from 'lucide-react';

const PENDING_SIGNUP_STORAGE_KEY = 'pending_signup_v1';

type PendingSignup = {
  email: string;
  name: string;
  phone: string;
  countryCode: string;
  passwordHash: string;
};

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordHash, setPasswordHash] = useState<string>('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_SIGNUP_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as PendingSignup;
      if (!parsed?.email || !parsed?.phone || !parsed?.name || !parsed?.passwordHash) return;
      setEmail(parsed.email);
      setName(parsed.name);
      setPhone(parsed.phone);
      setCountryCode(parsed.countryCode || '91');
      setPasswordHash(parsed.passwordHash);
      setStep('otp');
    } catch {
      sessionStorage.removeItem(PENDING_SIGNUP_STORAGE_KEY);
    }
  }, []);

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          countryCode,
          password,
          confirmPassword,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: { message?: string };
            data?: { otpRequired?: boolean; passwordHash?: string };
          }
        | null;

      if (!res.ok || !json?.success) {
        setError(json?.error?.message || 'Failed to start signup. Please try again.');
        return;
      }

      if (json.data?.otpRequired) {
        const nextPasswordHash = json.data.passwordHash || '';
        if (!nextPasswordHash) {
          setError('Signup started but password hash was not returned. Please try again.');
          return;
        }
        setPasswordHash(nextPasswordHash);
        try {
          const pending: PendingSignup = {
            email,
            name,
            phone,
            countryCode,
            passwordHash: nextPasswordHash,
          };
          sessionStorage.setItem(PENDING_SIGNUP_STORAGE_KEY, JSON.stringify(pending));
        } catch {
          // ignore storage errors
        }
        setStep('otp');
        setSuccess('OTP sent to your phone. Please enter it to complete signup.');
      } else {
        setError('Unable to continue. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let effectiveEmail = email;
      let effectivePhone = phone;
      let effectiveName = name;
      let effectivePasswordHash = passwordHash;

      if (!effectivePasswordHash) {
        try {
          const stored = sessionStorage.getItem(PENDING_SIGNUP_STORAGE_KEY);
          const parsed = stored ? (JSON.parse(stored) as PendingSignup) : null;
          if (parsed?.passwordHash) {
            effectiveEmail = parsed.email;
            effectivePhone = parsed.phone;
            effectiveName = parsed.name;
            effectivePasswordHash = parsed.passwordHash;
          }
        } catch {
          // ignore
        }
      }

      if (!effectiveEmail || !effectivePhone || !effectiveName || !effectivePasswordHash) {
        setError('Missing signup details. Please go back and start signup again.');
        setStep('form');
        return;
      }

      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: effectiveEmail,
          phone: effectivePhone,
          name: effectiveName,
          otp,
          passwordHash: effectivePasswordHash,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string } }
        | null;

      if (!res.ok || !json?.success) {
        setError(json?.error?.message || 'OTP verification failed.');
        return;
      }

      sessionStorage.removeItem(PENDING_SIGNUP_STORAGE_KEY);
      setSuccess('Account created successfully! Redirecting...');
      window.location.href = '/';
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setOtp('');

    try {
      const res = await fetch('/api/auth/signup/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          countryCode,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { message?: string } }
        | null;

      if (!res.ok || !json?.success) {
        setError(json?.error?.message || 'Failed to resend OTP. Please try again.');
        return;
      }

      setSuccess(json.data?.message || 'OTP resent successfully. Please check your phone.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'form') {
      await handleSignup();
    } else {
      await handleVerifyOtp();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Join the Inner Circle</h1>
          <p className="text-neutral-500">Create an account for early access and personalized styling.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          {step === 'form' ? (
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3">
                <div className="w-28">
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="Code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative group flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                  <input
                    required
                    type="text"
                    inputMode="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={6}
                />
              </div>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Resend OTP
              </button>
            </div>
          )}

          <p className="text-[10px] text-neutral-400 text-center uppercase tracking-widest leading-relaxed">
            By creating an account, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span>{step === 'form' ? 'Creating Account...' : 'Verifying OTP...'}</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              <>
                <span>{step === 'form' ? 'Create Account' : 'Verify & Complete'}</span>
                <Sparkles size={18} />
              </>
            )}
          </button>
        </form>

        {step === 'otp' && (
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setOtp('');
              setPasswordHash('');
              sessionStorage.removeItem(PENDING_SIGNUP_STORAGE_KEY);
            }}
            className="w-full text-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Back to form
          </button>
        )}

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Already have an account? {' '}
            <Link href="/login" className="text-neutral-900 font-bold hover:underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
