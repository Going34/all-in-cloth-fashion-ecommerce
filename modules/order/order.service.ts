import { NotFoundError, ValidationError } from '@/lib/errors';
import { findOrderById, createOrder as createOrderRepo, findOrdersAdmin, findOrderByIdAdmin, findOrdersByUserId, updateOrderStatusAdmin as updateOrderStatusAdminRepo } from './order.repository';
import type { CreateOrderRequest, OrderResponse, AdminOrderListQuery, AdminOrderListResponse } from './order.types';
import type { OrderStatus } from '@/types';

export async function getOrder(id: string, userId?: string): Promise<OrderResponse> {
  const order = await findOrderById(id);

  if (!order) {
    throw new NotFoundError('Order', id);
  }

  if (userId && order.user_id !== userId) {
    throw new NotFoundError('Order', id);
  }

  return order;
}

export async function listOrders(userId: string, filters?: { status?: OrderStatus; limit?: number }): Promise<OrderResponse[]> {
  return await findOrdersByUserId(userId, filters);
}

export async function createOrder(
  userId: string,
  data: CreateOrderRequest,
  shippingAmount: number = 0
): Promise<OrderResponse> {
  return await createOrderRepo(userId, data, shippingAmount);
}

export async function listOrdersAdmin(query: AdminOrderListQuery): Promise<AdminOrderListResponse> {
  const page = query.page || 1;
  const limit = query.limit || 20;

  const result = await findOrdersAdmin({
    page,
    limit,
    status: query.status,
    search: query.search,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    sort: query.sort || 'created_at:desc',
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    orders: result.orders,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
    },
  };
}

export async function getOrderAdmin(id: string): Promise<any> {
  const order = await findOrderByIdAdmin(id);

  if (!order) {
    throw new NotFoundError('Order', id);
  }

  return order;
}

const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus,
  notes?: string
): Promise<any> {
  const order = await findOrderByIdAdmin(id);

  if (!order) {
    throw new NotFoundError('Order', id);
  }

  const currentStatus = order.status as OrderStatus;
  const allowedStatuses = validStatusTransitions[currentStatus];

  if (!allowedStatuses.includes(status)) {
    throw new ValidationError(
      `Cannot transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedStatuses.join(', ')}`
    );
  }

  return await updateOrderStatusAdminRepo(id, status, notes);
}

export async function exportOrdersCSV(filters: {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
}): Promise<string> {
  const result = await findOrdersAdmin({
    page: 1,
    limit: 10000,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: 'created_at:desc',
  });

  const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Shipping'];
  const rows = result.orders.map((order) => [
    order.order_number,
    new Date(order.created_at).toLocaleDateString(),
    order.customer.name,
    order.customer.email,
    `$${order.total.toFixed(2)}`,
    order.status,
    `$${order.shipping.toFixed(2)}`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

