import { getAdminDbClient } from '@/lib/adminDb';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { OrderItem, OrderStatus, OrderStatusHistory, Payment } from '@/types';
import type { AdminOrderListItem, CreateOrderRequest, OrderResponse } from './order.types';

type Row = Record<string, unknown>;

export async function findOrderById(id: string): Promise<OrderResponse | null> {
  const db = getAdminDbClient();

  const { data, error } = await db
    .from('orders')
    .select(
      `
      *,
      order_items (*),
      order_status_history (*),
      payments (*)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const order = data as unknown as OrderResponse & {
    order_items?: OrderItem[];
    order_status_history?: OrderStatusHistory[];
    payments?: Payment[];
  };

  return {
    ...order,
    items: order.order_items || [],
    status_history: order.order_status_history || [],
    payment: order.payments && order.payments.length > 0 ? order.payments[0] : null,
  };
}

export async function createOrder(
  userId: string,
  orderData: CreateOrderRequest,
  shippingAmount: number = 0,
  idempotencyKey?: string
): Promise<OrderResponse> {
  const db = getAdminDbClient();

  const { data: result, error: rpcError } = await db.rpc('create_order_transactional', {
    p_user_id: userId,
    p_order_items: orderData.items,
    p_address_id: orderData.address_id,
    p_shipping_amount: shippingAmount,
    p_order_idempotency_key: idempotencyKey || null,
  });

  if (rpcError) {
    const errorMessage = rpcError.message || 'Unknown error';
    
    if (errorMessage.includes('Insufficient stock')) {
      throw new ConflictError(errorMessage);
    }
    if (errorMessage.includes('not found')) {
      throw new NotFoundError(errorMessage);
    }
    
    throw new Error(`Failed to create order: ${errorMessage}`);
  }

  const orderResult = result as {
    success: boolean;
    order_id: string;
    order_number: string;
    duplicate?: boolean;
  };

  if (orderResult.duplicate) {
    const existingOrder = await findOrderById(orderResult.order_id);
    if (!existingOrder) {
      throw new Error('Duplicate order found but could not be retrieved');
    }
    return existingOrder;
  }

  const createdOrder = await findOrderById(orderResult.order_id);
  if (!createdOrder) {
    throw new Error('Failed to retrieve created order');
  }

  return createdOrder;
}

export async function findOrdersAdmin(filters: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'created_at:asc' | 'created_at:desc' | 'total:asc' | 'total:desc';
}): Promise<{
  orders: AdminOrderListItem[];
  total: number;
}> {
  const db = getAdminDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = db
    .from('orders')
    .select(
      `
      *,
      users!orders_user_id_fkey (id, email, name),
      order_items (quantity)
    `,
      { count: 'exact' }
    );

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.search) {
    query = query.or(
      `order_number.ilike.%${filters.search}%,users.email.ilike.%${filters.search}%,users.name.ilike.%${filters.search}%`
    );
  }

  const sortField = filters.sort?.split(':')[0] || 'created_at';
  const sortOrder = filters.sort?.split(':')[1] === 'asc' ? true : false;
  query = query.order(sortField, { ascending: sortOrder });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  const rows = (data ?? []) as unknown[];
  const orders: AdminOrderListItem[] = rows.map((r) => {
    const row = r as Row;
    const user = (row.users ?? {}) as Row;
    const orderItems = (Array.isArray(row.order_items) ? (row.order_items as unknown[]) : []).map(
      (i) => i as Row
    );
    const itemCount = orderItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);

    return {
      id: String(row.id ?? ''),
      order_number: String(row.order_number ?? ''),
      customer: {
        id: String(user.id ?? ''),
        name: String(user.name ?? ''),
        email: String(user.email ?? ''),
      },
      status: row.status as OrderStatus,
      total: Number(row.total ?? 0),
      subtotal: Number(row.subtotal ?? 0),
      tax: Number(row.tax ?? 0),
      shipping: Number(row.shipping ?? 0),
      itemCount,
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? ''),
    };
  });

  return {
    orders,
    total: count || 0,
  };
}

export async function findOrdersByUserId(
  userId: string,
  filters?: {
    status?: OrderStatus;
    limit?: number;
  }
): Promise<OrderResponse[]> {
  const db = getAdminDbClient();

  let query = db
    .from('orders')
    .select(
      `
      *,
      order_items (*),
      order_status_history (*),
      payments (*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  const rows = (data ?? []) as unknown[];
  return rows.map((r) => {
    const row = r as unknown as OrderResponse & {
      order_items?: OrderItem[];
      order_status_history?: OrderStatusHistory[];
      payments?: Payment[];
    };
    return {
      ...row,
      items: row.order_items || [],
      status_history: row.order_status_history || [],
      payment: row.payments && row.payments.length > 0 ? row.payments[0] : null,
    };
  });
}

export async function findOrdersByUserIdPaginated(
  userId: string,
  filters: {
    status?: OrderStatus;
    page: number;
    limit: number;
  }
): Promise<{ orders: OrderResponse[]; total: number }> {
  const db = getAdminDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = db
    .from('orders')
    .select(
      `
      *,
      order_items (*),
      order_status_history (*),
      payments (*)
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  const rows = (data ?? []) as unknown[];
  const orders = rows.map((r) => {
    const row = r as unknown as OrderResponse & {
      order_items?: OrderItem[];
      order_status_history?: OrderStatusHistory[];
      payments?: Payment[];
    };
    return {
      ...row,
      items: row.order_items || [],
      status_history: row.order_status_history || [],
      payment: row.payments && row.payments.length > 0 ? row.payments[0] : null,
    };
  });

  return {
    orders,
    total: count || 0,
  };
}

export async function findOrderByIdAdmin(id: string): Promise<unknown | null> {
  const db = getAdminDbClient();

  const { data, error } = await db
    .from('orders')
    .select(
      `
      *,
      users!orders_user_id_fkey (id, email, name, phone),
      addresses!orders_address_id_fkey (*),
      payments (*),
      order_items (*),
      order_status_history (*)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const order = data as Row;
  const user = (order.users ?? {}) as Row;
  const address = (order.addresses ?? {}) as Row;
  const payments = Array.isArray(order.payments) ? (order.payments as unknown[]).map((p) => p as Row) : [];
  const payment = payments[0] ?? null;
  const orderStatusHistory = Array.isArray(order.order_status_history)
    ? (order.order_status_history as unknown[]).map((h) => h as Row)
    : [];
  const orderItems = Array.isArray(order.order_items)
    ? (order.order_items as unknown[]).map((i) => i as Row)
    : [];

  return {
    id: String(order.id ?? ''),
    orderNumber: String(order.order_number ?? ''),
    customer: {
      id: String(user.id ?? ''),
      name: String(user.name ?? ''),
      email: String(user.email ?? ''),
      phone: (user.phone as string | null | undefined) ?? null,
    },
    shippingAddress: address.id
      ? {
          name: String(address.name ?? ''),
          street: String(address.street ?? ''),
          city: String(address.city ?? ''),
          state: String(address.state ?? ''),
          zip: String(address.zip ?? ''),
          country: String(address.country ?? ''),
        }
      : null,
    status: order.status as OrderStatus,
    statusHistory: orderStatusHistory.map((h) => ({
      status: h.status as OrderStatus,
      changedAt: String((h.changed_at ?? h.created_at) ?? ''),
    })),
    items: orderItems.map((item) => ({
      id: String(item.id ?? ''),
      productName: String(item.product_name_snapshot ?? ''),
      sku: String(item.sku_snapshot ?? ''),
      price: Number(item.price_snapshot ?? 0),
      quantity: Number(item.quantity ?? 0),
      variantId: String(item.variant_id ?? ''),
    })),
    payment: payment
      ? {
          method: String(payment.method ?? ''),
          status: String(payment.status ?? ''),
          amount: Number(payment.amount ?? 0),
          transactionId: String(payment.id ?? ''),
        }
      : null,
    shipping: {
      method: 'standard',
      rate: Number(order.shipping ?? 0),
      trackingNumber: null,
    },
    subtotal: Number(order.subtotal ?? 0),
    tax: Number(order.tax ?? 0),
    total: Number(order.total ?? 0),
    createdAt: String(order.created_at ?? ''),
    updatedAt: String(order.updated_at ?? ''),
  };
}

export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus,
  _notes?: string
): Promise<unknown> {
  const db = getAdminDbClient();
  void _notes;

  const { data: existingOrder } = await db
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const { error: updateError } = await db
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  const { error: historyError } = await db
    .from('order_status_history')
    .insert({
      order_id: id,
      status,
    });

  if (historyError) {
    throw new Error(`Failed to create status history: ${historyError.message}`);
  }

  return await findOrderByIdAdmin(id);
}

