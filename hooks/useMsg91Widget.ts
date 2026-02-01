'use client';

import { useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MSG91 Widget Configuration
 */
export interface Msg91WidgetConfig {
  widgetId: string;
  tokenAuth?: string; // Optional token for authentication
  identifier?: string; // Phone number or email (optional, can be set later)
  exposeMethods?: boolean; // When true, exposes methods for OTP verification
  body_1?: string; // Custom body text
}

/**
 * MSG91 Widget Success Response
 */
export interface Msg91WidgetSuccessData {
  token?: string; // JWT access token from MSG91
  identifier?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * MSG91 Widget Error
 */
export interface Msg91WidgetError {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

/**
 * Hook return type
 */
export interface UseMsg91WidgetReturn {
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  initWidget: (config: Msg91WidgetConfig) => Promise<void>;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  verifyAccessToken: (accessToken: string, name?: string) => Promise<{ error: Error | null }>;
}

declare global {
  interface Window {
    initSendOTP?: (config: Msg91WidgetConfig & {
      success?: (data: Msg91WidgetSuccessData) => void;
      failure?: (error: Msg91WidgetError) => void;
    }) => void;
    sendOtp?: (identifier: string) => Promise<void>;
    verifyOtp?: (otp: string) => Promise<void>;
  }
}

/**
 * React hook for MSG91 OTP Widget integration
 * 
 * Usage:
 * ```tsx
 * const { initWidget, sendOtp, verifyOtp, verifyAccessToken, isLoading, error } = useMsg91Widget();
 * 
 * useEffect(() => {
 *   initWidget({
 *     widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!,
 *     exposeMethods: true,
 *     success: (data) => {
 *       verifyAccessToken(data.token);
 *     }
 *   });
 * }, []);
 * ```
 */
export function useMsg91Widget(): UseMsg91WidgetReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scriptLoadedRef = useRef(false);
  const widgetConfigRef = useRef<Msg91WidgetConfig | null>(null);
  const router = useRouter();

  /**
   * Load MSG91 OTP widget script
   */
  const loadWidgetScript = useCallback(async (): Promise<void> => {
    if (scriptLoadedRef.current || typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      const urls = [
        'https://verify.msg91.com/otp-provider.js',
        'https://verify.phone91.com/otp-provider.js',
      ];

      let currentIndex = 0;

      const attemptLoad = () => {
        const script = document.createElement('script');
        script.src = urls[currentIndex];
        script.async = true;

        script.onload = () => {
          if (typeof window.initSendOTP === 'function') {
            scriptLoadedRef.current = true;
            setIsReady(true);
            resolve();
          } else {
            reject(new Error('MSG91 widget script loaded but initSendOTP not found'));
          }
        };

        script.onerror = () => {
          currentIndex++;
          if (currentIndex < urls.length) {
            attemptLoad();
          } else {
            reject(new Error('Failed to load MSG91 widget script from all sources'));
          }
        };

        document.head.appendChild(script);
      };

      attemptLoad();
    });
  }, []);

  /**
   * Initialize MSG91 widget
   */
  const initWidget = useCallback(async (config: Msg91WidgetConfig): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Load script if not already loaded
      if (!scriptLoadedRef.current) {
        await loadWidgetScript();
      }

      if (typeof window.initSendOTP !== 'function') {
        throw new Error('MSG91 widget not available');
      }

      widgetConfigRef.current = config;

      // Initialize widget with success/failure callbacks
      window.initSendOTP({
        ...config,
        success: (data: Msg91WidgetSuccessData) => {
          console.log('[MSG91 Widget] Success:', data);
          // Callback is handled by user through verifyAccessToken
        },
        failure: (err: Msg91WidgetError) => {
          console.error('[MSG91 Widget] Failure:', err);
          setError(new Error(err.message || 'MSG91 widget error'));
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize MSG91 widget');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadWidgetScript]);

  /**
   * Send OTP using widget methods (requires exposeMethods: true)
   */
  const sendOtp = useCallback(async (identifier: string): Promise<void> => {
    if (!isReady) {
      throw new Error('Widget not initialized. Call initWidget first.');
    }

    if (typeof window.sendOtp !== 'function') {
      throw new Error('sendOtp method not available. Set exposeMethods: true in widget config.');
    }

    try {
      setIsLoading(true);
      setError(null);
      await window.sendOtp(identifier);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send OTP');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  /**
   * Verify OTP using widget methods (requires exposeMethods: true)
   */
  const verifyOtp = useCallback(async (otp: string): Promise<void> => {
    if (!isReady) {
      throw new Error('Widget not initialized. Call initWidget first.');
    }

    if (typeof window.verifyOtp !== 'function') {
      throw new Error('verifyOtp method not available. Set exposeMethods: true in widget config.');
    }

    try {
      setIsLoading(true);
      setError(null);
      await window.verifyOtp(otp);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify OTP');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  /**
   * Verify access token on server and create/update user session
   */
  const verifyAccessToken = useCallback(async (
    accessToken: string,
    name?: string
  ): Promise<{ error: Error | null }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/verify-widget-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error?.message || 'Token verification failed';
        const error = new Error(errorMsg);
        setError(error);
        return { error };
      }

      // Success - user is now authenticated
      // Refresh page or redirect
      router.refresh();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify access token');
      setError(error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    isLoading,
    isReady,
    error,
    initWidget,
    sendOtp,
    verifyOtp,
    verifyAccessToken,
  };
}

