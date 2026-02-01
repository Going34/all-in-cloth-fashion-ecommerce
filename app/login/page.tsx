'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function getSafeRedirectPath(input: string | null): string {
  const fallback = '/';
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://')) return fallback;
  if (trimmed === '/login' || trimmed.startsWith('/login?')) return fallback;
  if (trimmed === '/signup' || trimmed.startsWith('/signup?')) return fallback;
  return trimmed;
}

function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const from = getSafeRedirectPath(searchParams.get('from'));

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) return;
    router.replace(from);
  }, [from, isAuthenticated, isAuthLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          countryCode,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { user?: unknown } }
        | null;

      if (!res.ok || !json?.success) {
        setError(json?.error?.message || 'Invalid email/phone or password.');
        return;
      }

      setTimeout(() => router.push(from), 100);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = identifier.includes('@');

  if (isAuthLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif">Welcome Back</h1>
          <p className="text-neutral-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Welcome Back</h1>
          <p className="text-neutral-500">Enter your email or phone number to access your account.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isEmail ? (
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-28">
                  <input
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
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
              <input
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded-sm border-neutral-200 text-neutral-900 focus:ring-0" />
              <span className="text-neutral-500">Remember Me</span>
            </label>
            <Link href="/forgot-password" className="text-neutral-900 hover:text-neutral-500 transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span>Logging in...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              <>
                <span>Login</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Don&apos;t have an account? {' '}
            <Link href="/signup" className="text-neutral-900 font-bold hover:underline underline-offset-4">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif">Welcome Back</h1>
          <p className="text-neutral-500 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
