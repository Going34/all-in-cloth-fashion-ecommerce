import { getDbClient } from '@/lib/db';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { Order, OrderItem, OrderStatus, OrderStatusHistory } from '@/types';
import type { CreateOrderRequest, OrderResponse } from './order.types';

export async function findOrderById(id: string): Promise<OrderResponse | null> {
  const supabase = await getDbClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (*),
      order_status_history (*)
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const order = data as any;
  return {
    ...order,
    items: order.order_items || [],
    status_history: order.order_status_history || [],
  };
}

export async function createOrder(
  userId: string,
  orderData: CreateOrderRequest,
  shippingAmount: number = 0
): Promise<OrderResponse> {
  const supabase = await getDbClient();

  const variantIds = orderData.items.map((i) => i.variant_id);
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select(
      `
      id,
      sku,
      price_override,
      products (id, name, base_price)
    `
    )
    .in('id', variantIds);

  if (variantsError || !variants || variants.length === 0) {
    throw new NotFoundError('Product variants');
  }

  for (const item of orderData.items) {
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('stock, reserved_stock')
      .eq('variant_id', item.variant_id)
      .single();

    if (inventoryError || !inventory) {
      const variant = (variants as any[]).find((v) => v.id === item.variant_id);
      throw new NotFoundError('Inventory', variant?.sku || item.variant_id);
    }

    const inv = inventory as { stock: number; reserved_stock: number };
    const availableStock = inv.stock - (inv.reserved_stock || 0);

    if (availableStock < item.quantity) {
      const variant = (variants as any[]).find((v) => v.id === item.variant_id);
      throw new ConflictError(
        `Insufficient stock for variant ${variant?.sku || item.variant_id}. Available: ${availableStock}, Requested: ${item.quantity}`
      );
    }
  }

  let subtotal = 0;
  const orderItems = orderData.items.map((item) => {
    const variant = (variants as any[]).find((v) => v.id === item.variant_id);
    const product = variant?.products as { base_price: number; name: string } | null;
    const price = variant?.price_override ?? product?.base_price ?? 0;
    subtotal += price * item.quantity;

    return {
      variant_id: variant?.id || null,
      quantity: item.quantity,
      product_name_snapshot: product?.name || 'Unknown Product',
      sku_snapshot: variant?.sku || '',
      price_snapshot: price,
    };
  });

  const tax = subtotal * 0.1;
  const total = subtotal + tax + shippingAmount;

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      status: 'pending',
      subtotal,
      tax,
      shipping: shippingAmount,
      total,
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message || 'Unknown error'}`);
  }

  const orderId = (order as Order).id;

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: orderId })));

  if (itemsError) {
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  const { error: statusError } = await supabase
    .from('order_status_history')
    .insert({ order_id: orderId, status: 'pending' });

  if (statusError) {
    throw new Error(`Failed to create status history: ${statusError.message}`);
  }

  for (const item of orderData.items) {
    const { error: reserveError } = await supabase.rpc('reserve_inventory', {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    });

    if (reserveError) {
      throw new Error(`Failed to reserve inventory: ${reserveError.message}`);
    }
  }

  const createdOrder = await findOrderById(orderId);
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
  orders: any[];
  total: number;
}> {
  const supabase = await getDbClient();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
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

  const orders = ((data as any[]) || []).map((order) => {
    const user = order.users || {};
    const itemCount = (order.order_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    return {
      id: order.id,
      order_number: order.order_number,
      customer: {
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
      },
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      itemCount,
      created_at: order.created_at,
      updated_at: order.updated_at,
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
  const supabase = await getDbClient();

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      order_items (*),
      order_status_history (*)
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

  return ((data as any[]) || []).map((order) => ({
    ...order,
    items: order.order_items || [],
    status_history: order.order_status_history || [],
  }));
}

export async function findOrderByIdAdmin(id: string): Promise<any | null> {
  const supabase = await getDbClient();

  const { data, error } = await supabase
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

  const order = data as any;
  const user = order.users || {};
  const address = order.addresses || {};
  const payment = (order.payments || [])[0] || null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    customer: {
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || null,
    },
    shippingAddress: address.id
      ? {
          name: address.name || '',
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          country: address.country || '',
        }
      : null,
    status: order.status,
    statusHistory: (order.order_status_history || []).map((h: any) => ({
      status: h.status,
      changedAt: h.changed_at || h.created_at,
    })),
    items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      productName: item.product_name_snapshot,
      sku: item.sku_snapshot,
      price: item.price_snapshot,
      quantity: item.quantity,
      variantId: item.variant_id,
    })),
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          amount: payment.amount,
          transactionId: payment.id,
        }
      : null,
    shipping: {
      method: 'standard',
      rate: order.shipping,
      trackingNumber: null,
    },
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function updateOrderStatusAdmin(
  id: string,
  status: OrderStatus,
  notes?: string
): Promise<any> {
  const supabase = await getDbClient();

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  const { error: historyError } = await supabase
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

