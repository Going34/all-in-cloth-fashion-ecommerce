import { ValidationError } from '@/lib/errors';
import type { InventoryListQuery, UpdateStockRequest } from './inventory.types';

export function validateInventoryListQuery(query: Record<string, string | undefined>): InventoryListQuery {
  const page = query.page ? parseInt(query.page, 10) : undefined;
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;

  if (page !== undefined && (page < 1 || isNaN(page))) {
    throw new ValidationError('Page must be a positive integer', { page: 'Invalid page value' });
  }

  if (limit !== undefined && (limit < 1 || limit > 100 || isNaN(limit))) {
    throw new ValidationError('Limit must be between 1 and 100', { limit: 'Invalid limit value' });
  }

  const validStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
  if (query.status && !validStatuses.includes(query.status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`, { status: 'Invalid status' });
  }

  return {
    page: page || 1,
    limit: limit || 50,
    search: query.search,
    status: query.status as InventoryListQuery['status'],
  };
}

export function validateUpdateStockRequest(body: unknown): UpdateStockRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!data.action || typeof data.action !== 'string') {
    errors.action = 'Action is required';
  } else if (!['set', 'add', 'subtract'].includes(data.action)) {
    errors.action = 'Action must be set, add, or subtract';
  }

  if (data.quantity === undefined || typeof data.quantity !== 'number') {
    errors.quantity = 'Quantity is required and must be a number';
  } else if (data.quantity < 0) {
    errors.quantity = 'Quantity must be non-negative';
  }

  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.notes = 'Notes must be a string';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    action: data.action as 'set' | 'add' | 'subtract',
    quantity: data.quantity as number,
    notes: data.notes as string | undefined,
  };
}

