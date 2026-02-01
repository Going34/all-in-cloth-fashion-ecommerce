'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, Lock, RefreshCw } from 'lucide-react';

export default function ForgotPassword() {
  const [countryCode, setCountryCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const sendResetOtp = async () => {
    const res = await fetch('/api/auth/forgot-password/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: { message?: string } }
      | null;
    
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || 'Failed to send OTP');
    }
  };

  const verifyAndReset = async () => {
    const res = await fetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode, otp, newPassword }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: { message?: string } }
      | null;
    
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || 'Failed to reset password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (step === 'phone') {
        await sendResetOtp();
        setSuccess('OTP sent to your phone. Enter it below to reset your password.');
        setStep('reset');
      } else {
        await verifyAndReset();
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => router.push('/login'), 700);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setIsLoading(true);
    setError(null);
    
    try {
      await sendResetOtp();
      setSuccess('OTP resent successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Reset Password</h1>
          <p className="text-neutral-500">Verify your phone number to reset your password.</p>
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

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-28">
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="Code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isLoading || step === 'reset'}
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
                  disabled={isLoading || step === 'reset'}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {step === 'reset' && (
              <>
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

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                  <input
                    required
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    minLength={6}
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span>{step === 'phone' ? 'Sending OTP...' : 'Resetting...'}</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              <span>{step === 'phone' ? 'Send OTP' : 'Reset Password'}</span>
            )}
          </button>
        </form>

        {step === 'reset' && (
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setNewPassword(''); }}
            className="w-full text-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Change phone number
          </button>
        )}

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Back to{' '}
            <Link href="/login" className="text-neutral-900 font-bold hover:underline underline-offset-4">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
