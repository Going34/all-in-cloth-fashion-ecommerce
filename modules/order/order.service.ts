import { NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDbClient } from '@/lib/adminDb';
import { findOrderById, createOrder as createOrderRepo, findOrdersAdmin, findOrderByIdAdmin, findOrdersByUserId, findOrdersByUserIdPaginated, updateOrderStatusAdmin as updateOrderStatusAdminRepo } from './order.repository';
import type { CreateOrderRequest, OrderResponse, AdminOrderListQuery, AdminOrderListResponse } from './order.types';
import type { OrderStatus } from '@/types';

export async function getOrder(id: string, userId?: string): Promise<OrderResponse> {
  const order = await findOrderById(id);

  if (!order) {
    console.error(`[OrderService] Order ${id} not found in DB`);
    throw new NotFoundError('Order', id);
  }

  if (userId && order.user_id !== userId) {
    console.error(`[OrderService] Order ${id} user mismatch. Order user: ${order.user_id}, Request user: ${userId}`);
    throw new NotFoundError('Order', id);
  }

  return order;
}

export async function listOrders(userId: string, filters?: { status?: OrderStatus; limit?: number }): Promise<OrderResponse[]> {
  return await findOrdersByUserId(userId, filters);
}

export async function listOrdersPaginated(
  userId: string,
  filters: { status?: OrderStatus; page: number; limit: number }
): Promise<{ orders: OrderResponse[]; total: number; totalPages: number }> {
  const result = await findOrdersByUserIdPaginated(userId, filters);
  const totalPages = Math.ceil(result.total / filters.limit);

  return {
    orders: result.orders,
    total: result.total,
    totalPages,
  };
}

export async function createOrder(
  userId: string,
  data: CreateOrderRequest,
  shippingAmount: number = 0,
  idempotencyKey?: string
): Promise<OrderResponse> {
  return await createOrderRepo(userId, data, shippingAmount, idempotencyKey, data.payment_mode);
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

export async function getOrderAdmin(id: string): Promise<unknown> {
  const order = await findOrderByIdAdmin(id);

  if (!order) {
    throw new NotFoundError('Order', id);
  }

  return order;
}

// Admin can transition between any statuses for flexibility
// This allows admins to fix mistakes or handle special cases
const validStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled', 'pending'], // Allow reverting to pending if needed
  shipped: ['delivered', 'paid'], // Allow reverting to paid if needed
  delivered: ['shipped'], // Allow reverting to shipped if needed (e.g., return/reshipment)
  cancelled: ['pending', 'paid'], // Allow un-cancelling orders
};

export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus,
  notes?: string
): Promise<unknown> {
  const db = getAdminDbClient();

  console.log('[ORDER SERVICE] Updating order status:', { id, requestedStatus: status });

  const { data: existingOrder, error: fetchError } = await db
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existingOrder) {
    console.error('[ORDER SERVICE] Order not found:', { id, error: fetchError });
    throw new NotFoundError('Order', id);
  }

  const currentStatus = existingOrder.status as OrderStatus;
  console.log('[ORDER SERVICE] Current order status:', { id, currentStatus, requestedStatus: status });

  if (currentStatus === status) {
    console.log('[ORDER SERVICE] Status unchanged, returning existing order');
    return await findOrderByIdAdmin(id);
  }

  const allowedStatuses = validStatusTransitions[currentStatus];
  console.log('[ORDER SERVICE] Checking status transition:', { currentStatus, requestedStatus: status, allowedStatuses });

  if (!allowedStatuses.includes(status)) {
    console.error('[ORDER SERVICE] Invalid status transition:', { currentStatus, requestedStatus: status, allowedStatuses });
    throw new ValidationError(
      `Cannot transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedStatuses.join(', ')}`
    );
  }

  console.log('[ORDER SERVICE] Updating order status in database');
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

