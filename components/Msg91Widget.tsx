'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMsg91Widget } from '@/hooks/useMsg91Widget';

/**
 * MSG91 OTP Widget Component
 * 
 * A ready-to-use component that integrates MSG91 OTP widget
 * 
 * Usage:
 * ```tsx
 * <Msg91Widget
 *   widgetId={process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!}
 *   onSuccess={(data) => {
 *     console.log('OTP verified:', data);
 *     // Handle success (e.g., redirect to dashboard)
 *   }}
 *   onError={(error) => {
 *     console.error('Error:', error);
 *   }}
 * />
 * ```
 */
interface Msg91WidgetProps {
  widgetId: string;
  tokenAuth?: string;
  identifier?: string;
  exposeMethods?: boolean;
  body_1?: string;
  onSuccess?: (data: { token?: string; identifier?: string; phone?: string; email?: string }) => void;
  onError?: (error: Error) => void;
  onTokenVerified?: (user: { id: string; phone: string; name?: string; roles: string[] }) => void;
  autoVerifyToken?: boolean; // Automatically verify token on server when received
  userName?: string; // User name to set during token verification
  className?: string;
}

export const Msg91Widget: React.FC<Msg91WidgetProps> = ({
  widgetId,
  tokenAuth,
  identifier,
  exposeMethods = false,
  body_1,
  onSuccess,
  onError,
  onTokenVerified,
  autoVerifyToken = true,
  userName,
  className,
}) => {
  const { verifyAccessToken, isLoading } = useMsg91Widget();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const widgetInitializedRef = useRef(false);

  /**
   * Handle widget success callback
   */
  const handleSuccess = useCallback(async (data: { token?: string; identifier?: string; phone?: string; email?: string }) => {
    try {
      console.log('[MSG91 Widget] Success callback received');
      console.log('[MSG91 Widget] Data:', {
        hasToken: !!data.token,
        tokenLength: data.token?.length,
        identifier: data.identifier,
        phone: data.phone,
        email: data.email,
      });
      
      // Call user's success callback
      onSuccess?.(data);

      // Auto-verify token on server if enabled
      if (autoVerifyToken && data.token) {
        console.log('[MSG91 Widget] Auto-verifying token on server...');
        const result = await verifyAccessToken(data.token, userName);
        
        if (result.error) {
          console.error('[MSG91 Widget] Token verification failed:', result.error);
          onError?.(result.error);
        } else {
          console.log('[MSG91 Widget] Token verified successfully, fetching user data...');
          // Token verified successfully - fetch user data
          const userResponse = await fetch('/api/auth/me');
          const userResult = await userResponse.json();
          
          if (userResult.success && userResult.data?.user) {
            console.log('[MSG91 Widget] User authenticated:', userResult.data.user);
            onTokenVerified?.(userResult.data.user);
          } else {
            console.error('[MSG91 Widget] Failed to fetch user data:', userResult);
          }
        }
      } else if (!data.token) {
        console.warn('[MSG91 Widget] No token received in success callback');
        onError?.(new Error('No access token received from MSG91 widget'));
      }
    } catch (err) {
      console.error('[MSG91 Widget] Error in success callback:', err);
      const error = err instanceof Error ? err : new Error('Failed to handle widget success');
      onError?.(error);
    }
  }, [autoVerifyToken, userName, verifyAccessToken, onSuccess, onError, onTokenVerified]);

  /**
   * Load and initialize MSG91 widget script
   */
  useEffect(() => {
    if (widgetInitializedRef.current || !widgetId || typeof window === 'undefined') {
      return;
    }

    const loadAndInit = async () => {
      try {
        // Load script
        if (!scriptLoaded) {
          const loadScript = (url: string): Promise<void> => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = url;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
              document.head.appendChild(script);
            });
          };

          try {
            await loadScript('https://verify.msg91.com/otp-provider.js');
          } catch {
            await loadScript('https://verify.phone91.com/otp-provider.js');
          }

          setScriptLoaded(true);
        }

        // Wait for initSendOTP to be available
        let attempts = 0;
        while (typeof window.initSendOTP !== 'function' && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (typeof window.initSendOTP !== 'function') {
          throw new Error('MSG91 widget script loaded but initSendOTP function not found');
        }

        // Initialize widget
        const configuration = {
          widgetId,
          tokenAuth,
          identifier,
          exposeMethods,
          body_1,
          success: handleSuccess,
          failure: (error: { message?: string; code?: string }) => {
            const err = new Error(error.message || 'MSG91 widget error');
            setInitError(err);
            onError?.(err);
          },
        };

        window.initSendOTP(configuration);
        widgetInitializedRef.current = true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize MSG91 widget');
        setInitError(error);
        onError?.(error);
      }
    };

    loadAndInit();
  }, [widgetId, tokenAuth, identifier, exposeMethods, body_1, scriptLoaded, handleSuccess, onError]);

  return (
    <div className={className}>
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-500">Loading OTP widget...</p>
        </div>
      )}
      
      {!scriptLoaded && !initError && (
        <div className="text-center py-4">
          <p className="text-sm text-neutral-500">Initializing OTP widget...</p>
        </div>
      )}

      {initError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {initError.message}
        </div>
      )}

      {/* Widget will be rendered by MSG91 script */}
      <div id="msg91-otp-widget"></div>
    </div>
  );
};

export default Msg91Widget;

