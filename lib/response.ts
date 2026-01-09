import { NextResponse } from 'next/server';
import { AppError, handleError, ValidationError } from './errors';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
  meta?: {
    cursor?: string;
    nextCursor?: string | null;
    prevCursor?: string | null;
    hasMore?: boolean;
    total?: number;
  };
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function errorResponse(error: unknown, status?: number): NextResponse<ApiResponse> {
  const appError = handleError(error);
  const statusCode = status || appError.statusCode;

  return NextResponse.json(
    {
      success: false,
      error: {
        message: appError.message,
        code: appError.code,
        ...(appError instanceof ValidationError && appError.fields
          ? { fields: appError.fields }
          : {}),
      },
    },
    { status: statusCode }
  );
}

export function paginatedResponse<T>(
  data: T[],
  meta: {
    cursor?: string;
    nextCursor?: string | null;
    prevCursor?: string | null;
    hasMore?: boolean;
    total?: number;
  },
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return successResponse(data, status, meta);
}

