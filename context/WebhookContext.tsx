'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * MSG91 Webhook Event Types
 */
export type WebhookEventType = 
  | 'otp_sent' 
  | 'otp_verified' 
  | 'otp_failed' 
  | 'verification_complete' 
  | 'verification_failed';

/**
 * Webhook Event Data Structure
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  reqId?: string;
  phone?: string;
  countryCode?: string;
  status: 'success' | 'failed' | 'pending';
  message?: string;
  timestamp: string;
  error?: string;
  useraccess?: string;
}

/**
 * Webhook Context State
 */
interface WebhookContextType {
  // Events
  events: WebhookEvent[];
  latestEvent: WebhookEvent | null;
  
  // Status
  isListening: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearEvents: () => void;
  getEventsByType: (type: WebhookEventType) => WebhookEvent[];
  getEventsByPhone: (phone: string) => WebhookEvent[];
  
  // Webhook Configuration
  webhookUrl: string;
  apiKey: string | null;
  setApiKey: (key: string) => void;
}

const WebhookContext = createContext<WebhookContextType | undefined>(undefined);

/**
 * Webhook Provider Component
 */
export const WebhookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<WebhookEvent | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Get webhook URL (client-side)
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/msg91`
    : '/api/webhooks/msg91';

  /**
   * Set API key (stored in memory, not persisted)
   */
  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    // Optionally store in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('webhook_api_key', key);
      } catch (e) {
        console.warn('Failed to store API key in sessionStorage:', e);
      }
    }
  }, []);

  /**
   * Load API key from sessionStorage on mount
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedKey = sessionStorage.getItem('webhook_api_key');
        if (storedKey) {
          setApiKeyState(storedKey);
        }
      } catch (e) {
        console.warn('Failed to load API key from sessionStorage:', e);
      }
    }
  }, []);

  /**
   * Add new webhook event
   */
  const addEvent = useCallback((eventData: Omit<WebhookEvent, 'id' | 'timestamp'>) => {
    const newEvent: WebhookEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    setLatestEvent(newEvent);
  }, []);

  /**
   * Simulate webhook event (for testing)
   * In production, this would be called by the webhook endpoint
   */
  const simulateWebhookEvent = useCallback(async (eventData: {
    type: WebhookEventType;
    reqId?: string;
    phone?: string;
    status?: 'success' | 'failed' | 'pending';
    message?: string;
  }) => {
    if (!apiKey) {
      setError(new Error('API key is required'));
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send webhook event');
      }

      // Add event to local state
      addEvent({
        type: eventData.type,
        reqId: eventData.reqId,
        phone: eventData.phone,
        status: eventData.status || 'success',
        message: eventData.message,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[WebhookContext] Error simulating webhook event:', error);
    }
  }, [apiKey, webhookUrl, addEvent]);

  /**
   * Start listening for webhook events
   * Note: In a real implementation, you might use Server-Sent Events (SSE) or WebSockets
   * For now, this is a placeholder that can be extended
   */
  const startListening = useCallback(async () => {
    if (isListening) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check webhook endpoint health
      const response = await fetch(webhookUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Webhook endpoint is not available');
      }

      setIsListening(true);

      // In a real implementation, you would set up SSE or WebSocket connection here
      // For now, we'll just mark as listening
      console.log('[WebhookContext] Started listening for webhook events');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start listening');
      setError(error);
      setIsListening(false);
      console.error('[WebhookContext] Error starting listener:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isListening, webhookUrl]);

  /**
   * Stop listening for webhook events
   */
  const stopListening = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setIsListening(false);
    console.log('[WebhookContext] Stopped listening for webhook events');
  }, [pollInterval]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setLatestEvent(null);
  }, []);

  /**
   * Get events by type
   */
  const getEventsByType = useCallback((type: WebhookEventType): WebhookEvent[] => {
    return events.filter((event) => event.type === type);
  }, [events]);

  /**
   * Get events by phone number
   */
  const getEventsByPhone = useCallback((phone: string): WebhookEvent[] => {
    return events.filter((event) => event.phone === phone);
  }, [events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const value: WebhookContextType = {
    events,
    latestEvent,
    isListening,
    isLoading,
    error,
    startListening,
    stopListening,
    clearEvents,
    getEventsByType,
    getEventsByPhone,
    webhookUrl,
    apiKey,
    setApiKey,
  };

  return (
    <WebhookContext.Provider value={value}>
      {children}
    </WebhookContext.Provider>
  );
};

/**
 * Hook to use Webhook Context
 */
export const useWebhook = (): WebhookContextType => {
  const context = useContext(WebhookContext);
  if (context === undefined) {
    throw new Error('useWebhook must be used within a WebhookProvider');
  }
  return context;
};

/**
 * Hook to simulate webhook events (for testing)
 */
export const useWebhookSimulator = () => {
  const { apiKey, webhookUrl } = useWebhook();

  const simulateEvent = useCallback(async (eventData: {
    type: WebhookEventType;
    reqId?: string;
    phone?: string;
    status?: 'success' | 'failed' | 'pending';
    message?: string;
  }) => {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send webhook event');
    }

    return await response.json();
  }, [apiKey, webhookUrl]);

  return { simulateEvent };
};

