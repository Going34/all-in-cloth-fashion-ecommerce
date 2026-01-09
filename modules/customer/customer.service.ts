import { NotFoundError } from '@/lib/errors';
import { findCustomersAdmin, findCustomerByIdAdmin } from './customer.repository';
import type { CustomerListQuery, CustomerListResponse, CustomerDetailsResponse } from './customer.types';

export async function listCustomersAdmin(query: CustomerListQuery): Promise<CustomerListResponse> {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const result = await findCustomersAdmin({
    page,
    limit,
    search: query.search,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    customers: result.customers,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
    },
  };
}

export async function getCustomerAdmin(id: string): Promise<CustomerDetailsResponse> {
  const customer = await findCustomerByIdAdmin(id);

  if (!customer) {
    throw new NotFoundError('Customer', id);
  }

  return customer;
}

