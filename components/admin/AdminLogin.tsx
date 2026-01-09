'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldCheck, ArrowRight, Loader2, Info } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const { login, isLoading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin && pathname === '/admin/login') {
      router.push('/admin/dashboard');
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const { error } = await login(email, password);
      
      if (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
        setIsAuthenticating(false);
        return;
      }
      
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
        <div className="text-center text-white">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 text-white rounded-3xl mb-2 shadow-2xl shadow-indigo-500/40 border border-indigo-400/20">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-white tracking-tight">Portal Entry</h1>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-medium">All in cloth Management Suite</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Admin Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  placeholder="admin@allincloth.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-3 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/50 space-y-3">
            <p className="text-slate-500 text-xs flex items-center justify-center space-x-2">
              <Info size={14} />
              <span>Admin accounts require appropriate role permissions</span>
            </p>
            {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <p className="text-slate-400 text-xs font-mono text-center">
                  <span className="text-slate-500">Dev Mode:</span> Default admin credentials
                  <br />
                  <span className="text-indigo-400">admin@allincloth.com</span> / <span className="text-indigo-400">Admin@123</span>
                  <br />
                  <span className="text-slate-500 text-[10px]">Run: npm run create:admin</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Return to storefront
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
