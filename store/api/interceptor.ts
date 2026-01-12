import { AxiosResponse, AxiosError } from 'axios';
import type { ApiRequestConfig } from './client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  meta?: any;
}

export interface StandardizedError {
  message: string;
  code?: string;
  status?: number;
  fields?: Record<string, string>;
}

export const apiInterceptor = {
  request: (config: ApiRequestConfig): ApiRequestConfig => {
    const modifiedConfig = { ...config };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (token && modifiedConfig.headers) {
        modifiedConfig.headers = {
          ...modifiedConfig.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    if (modifiedConfig.params) {
      Object.keys(modifiedConfig.params).forEach((key) => {
        if (modifiedConfig.params![key] === null || modifiedConfig.params![key] === undefined) {
          delete modifiedConfig.params![key];
        }
      });
    }

    if (modifiedConfig.data && typeof modifiedConfig.data === 'object') {
      modifiedConfig.data = JSON.parse(JSON.stringify(modifiedConfig.data));
    }

    return modifiedConfig;
  },

  response: <T = any>(response: AxiosResponse<ApiResponse<T>>): T => {
    if (response.data && typeof response.data === 'object') {
      if ('success' in response.data && response.data.success && 'data' in response.data) {
        return response.data.data as T;
      }
      
      if ('data' in response.data) {
        return response.data.data as T;
      }
    }

    return response.data as T;
  },

  error: (error: AxiosError<ApiResponse>): StandardizedError => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          
          // Check if user is on an admin page - redirect to appropriate login
          // Use pathname without query params for more reliable detection
          const currentPath = window.location.pathname || '/';
          const isAdminPath = currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/login');
          
          // Only redirect to admin login if on admin pages, otherwise redirect to regular login
          const loginPath = isAdminPath ? '/admin/login' : '/login';
          
          // Preserve the current path as redirect parameter for regular users
          // Only add redirect param if not already on login page to avoid loops
          if (!isAdminPath && !currentPath.startsWith('/login') && !currentPath.startsWith('/signup')) {
            const redirectUrl = `${loginPath}?from=${encodeURIComponent(currentPath)}`;
            window.location.href = redirectUrl;
          } else if (isAdminPath) {
            window.location.href = loginPath;
          }
        }
        return {
          message: 'Unauthorized. Please login again.',
          code: 'UNAUTHORIZED',
          status: 401,
        };
      }

      if (status === 403) {
        return {
          message: data?.error?.message || 'Forbidden. You do not have permission.',
          code: 'FORBIDDEN',
          status: 403,
        };
      }

      if (data?.error) {
        return {
          message: data.error.message || 'An error occurred',
          code: data.error.code,
          status,
          fields: data.error.fields,
        };
      }

      return {
        message: error.message || 'An error occurred',
        code: 'API_ERROR',
        status,
      };
    }

    if (error.request) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  },
};

