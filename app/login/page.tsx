'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, "Jordan Smith");
    router.push(from);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Welcome Back</h1>
          <p className="text-neutral-500">Enter your details to access your boutique account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
              <input 
                required
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
              <input 
                required
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="rounded-sm border-neutral-200 text-neutral-900 focus:ring-0" />
              <span className="text-neutral-500">Remember Me</span>
            </label>
            <a href="#" className="text-neutral-900 hover:text-neutral-500 transition-colors">Forgot Password?</a>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2"
          >
            <span>Login to Account</span>
            <LogIn size={18} />
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Don't have an account? {' '}
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

