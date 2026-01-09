import { ValidationError } from '@/lib/errors';
import type { CustomerListQuery } from './customer.types';

export function validateCustomerListQuery(query: Record<string, string | undefined>): CustomerListQuery {
  const page = query.page ? parseInt(query.page, 10) : undefined;
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;

  if (page !== undefined && (page < 1 || isNaN(page))) {
    throw new ValidationError('Page must be a positive integer', { page: 'Invalid page value' });
  }

  if (limit !== undefined && (limit < 1 || limit > 100 || isNaN(limit))) {
    throw new ValidationError('Limit must be between 1 and 100', { limit: 'Invalid limit value' });
  }

  return {
    page: page || 1,
    limit: limit || 10,
    search: query.search,
  };
}

