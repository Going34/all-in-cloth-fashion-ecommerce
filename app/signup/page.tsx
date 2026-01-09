'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Sparkles } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(email, name);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Join the Inner Circle</h1>
          <p className="text-neutral-500">Create an account for early access and personalized styling.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
              <input 
                required
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
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
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 text-center uppercase tracking-widest leading-relaxed">
            By creating an account, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          <button 
            type="submit"
            className="w-full py-5 bg-neutral-900 text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign Up Now</span>
            <Sparkles size={18} />
          </button>
        </form>

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

