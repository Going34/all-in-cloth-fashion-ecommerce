import { ValidationError } from '@/lib/errors';
import type { CreateOrderRequest, AdminOrderListQuery } from './order.types';

export function validateCreateOrderRequest(body: unknown): CreateOrderRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!data.items || !Array.isArray(data.items)) {
    errors.items = 'Items array is required';
  } else if (data.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors[`items[${index}]`] = 'Item must be an object';
        return;
      }

      if (!item.variant_id || typeof item.variant_id !== 'string') {
        errors[`items[${index}].variant_id`] = 'Variant ID is required';
      }

      if (item.quantity === undefined || typeof item.quantity !== 'number') {
        errors[`items[${index}].quantity`] = 'Quantity is required and must be a number';
      } else if (item.quantity < 1) {
        errors[`items[${index}].quantity`] = 'Quantity must be at least 1';
      } else if (item.quantity > 100) {
        errors[`items[${index}].quantity`] = 'Quantity cannot exceed 100';
      }
    });
  }

  if (!data.address_id || typeof data.address_id !== 'string') {
    errors.address_id = 'Address ID is required';
  }

  if (data.coupon_code !== undefined && typeof data.coupon_code !== 'string') {
    errors.coupon_code = 'Coupon code must be a string';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    items: data.items as CreateOrderRequest['items'],
    address_id: data.address_id as string,
    coupon_code: data.coupon_code as string | undefined,
  };
}

export function validateAdminOrderListQuery(query: Record<string, string | undefined>): AdminOrderListQuery {
  const page = query.page ? parseInt(query.page, 10) : undefined;
  const limit = query.limit ? parseInt(query.limit, 10) : undefined;

  if (page !== undefined && (page < 1 || isNaN(page))) {
    throw new ValidationError('Page must be a positive integer', { page: 'Invalid page value' });
  }

  if (limit !== undefined && (limit < 1 || limit > 100 || isNaN(limit))) {
    throw new ValidationError('Limit must be between 1 and 100', { limit: 'Invalid limit value' });
  }

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (query.status && !validStatuses.includes(query.status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`, { status: 'Invalid status' });
  }

  const validSorts = ['created_at:asc', 'created_at:desc', 'total:asc', 'total:desc'];
  if (query.sort && !validSorts.includes(query.sort)) {
    throw new ValidationError(`Sort must be one of: ${validSorts.join(', ')}`, { sort: 'Invalid sort value' });
  }

  if (query.dateFrom && isNaN(Date.parse(query.dateFrom))) {
    throw new ValidationError('dateFrom must be a valid ISO date string', { dateFrom: 'Invalid date format' });
  }

  if (query.dateTo && isNaN(Date.parse(query.dateTo))) {
    throw new ValidationError('dateTo must be a valid ISO date string', { dateTo: 'Invalid date format' });
  }

  return {
    page: page || 1,
    limit: limit || 20,
    status: query.status as AdminOrderListQuery['status'],
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    sort: (query.sort as AdminOrderListQuery['sort']) || 'created_at:desc',
  };
}

