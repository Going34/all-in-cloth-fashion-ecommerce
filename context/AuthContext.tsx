'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '@/types';

interface AuthUser extends User {
  roles: Role[];
}

interface SendOtpResult {
  error: Error | null;
  otpRequired?: boolean;
  loggedIn?: boolean;
  reqId?: string; // Optional - only for MSG91 Widget API, not needed for custom OTP
}

interface SignupResult {
  error: Error | null;
  otpRequired?: boolean;
}

interface SignupVerifyOtpResult {
  error: Error | null;
}

interface LoginResult {
  error: Error | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, countryCode?: string) => Promise<LoginResult>;
  signup: (email: string, name: string, phone: string, countryCode: string, password: string, confirmPassword: string) => Promise<SignupResult>;
  signupVerifyOtp: (email: string, phone: string, countryCode: string, otp: string) => Promise<SignupVerifyOtpResult>;
  sendOtp: (phone: string, countryCode?: string) => Promise<SendOtpResult>;
  verifyOtp: (params: {
    phone: string;
    countryCode?: string;
    otp: string;
    name?: string;
    reqId?: string; // Optional - only for MSG91 Widget API, not needed for custom OTP
  }) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; data?: { user?: AuthUser } }
        | null;

      if (!res.ok || !json?.success) {
        setUser(null);
        return;
      }

      setUser((json.data?.user as AuthUser) ?? null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        await refreshUser();
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const sendOtp = async (phone: string, countryCode?: string): Promise<SendOtpResult> => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, countryCode }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { otpRequired?: boolean; loggedIn?: boolean; reqId?: string } }
        | null;

      if (!res.ok || !json?.success) {
        return { error: new Error(json?.error?.message || 'Failed to send OTP') };
      }

      if (json.data?.loggedIn) {
        await refreshUser();
      }

      return {
        error: null,
        otpRequired: !!json.data?.otpRequired,
        loggedIn: !!json.data?.loggedIn,
        reqId: json.data?.reqId, // MSG91 Widget API returns this
      };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Failed to send OTP') };
    }
  };

  const verifyOtp = async (params: {
    phone: string;
    countryCode?: string;
    otp: string;
    name?: string;
    reqId?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: params.phone,
          countryCode: params.countryCode,
          otp: params.otp,
          name: params.name,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { user?: AuthUser } }
        | null;

      if (!res.ok || !json?.success) {
        return { error: new Error(json?.error?.message || 'OTP verification failed') };
      }

      setUser((json.data?.user as AuthUser) ?? null);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('OTP verification failed') };
    }
  };

  const login = async (identifier: string, password: string, countryCode?: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, countryCode }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { user?: AuthUser } }
        | null;

      if (!res.ok || !json?.success) {
        return { error: new Error(json?.error?.message || 'Login failed') };
      }

      setUser((json.data?.user as AuthUser) ?? null);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Login failed') };
    }
  };

  const signup = async (
    email: string,
    name: string,
    phone: string,
    countryCode: string,
    password: string,
    confirmPassword: string
  ): Promise<SignupResult> => {
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
        | { success?: boolean; error?: { message?: string }; data?: { otpRequired?: boolean } }
        | null;

      if (!res.ok || !json?.success) {
        return { error: new Error(json?.error?.message || 'Signup failed') };
      }

      return {
        error: null,
        otpRequired: !!json.data?.otpRequired,
      };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Signup failed') };
    }
  };

  const signupVerifyOtp = async (
    email: string,
    phone: string,
    countryCode: string,
    otp: string
  ): Promise<SignupVerifyOtpResult> => {
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          countryCode,
          otp,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { user?: AuthUser } }
        | null;

      if (!res.ok || !json?.success) {
        return { error: new Error(json?.error?.message || 'OTP verification failed') };
      }

      setUser((json.data?.user as AuthUser) ?? null);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('OTP verification failed') };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.roles?.some(
    (role) => role.name === 'ADMIN' || role.name === 'OPS'
  ) ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        login,
        signup,
        signupVerifyOtp,
        sendOtp,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
