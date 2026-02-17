import { getAdminDbClient } from '@/lib/adminDb';
import { NotFoundError, ConflictError } from '@/lib/errors';
import type { OrderItem, OrderStatus, OrderStatusHistory, Payment, Address } from '@/types';
import type { AdminOrderListItem, CreateOrderRequest, OrderResponse, EnrichedOrderItem } from './order.types';

type Row = Record<string, unknown>;

export async function findOrderById(id: string): Promise<OrderResponse | null> {
  const db = getAdminDbClient();

  const { data, error } = await db
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        product_variants (
            id,
            color,
            size,
            products (
                id,
                name,
                product_images (
                    image_url,
                    display_order
                )
            ),
            variant_images (
                image_url,
                display_order
            )
        )
      ),
      order_status_history (*),
      payments (*),
      addresses!orders_address_id_fkey (*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error finding order:', error);
    return null;
  }
  if (!data) {
    console.error('Order not found in DB', id);
    return null;
  }

  // Helper types for the raw response structure
  type RawVariantImage = { image_url: string; display_order?: number };
  type RawProductImage = { image_url: string; display_order?: number };
  type RawProduct = { id: string; name: string; product_images?: RawProductImage[] };
  type RawVariant = {
    id: string;
    color: string;
    size: string;
    products?: RawProduct | RawProduct[] | null;
    variant_images?: RawVariantImage[];
  };
  type RawOrderItem = OrderItem & { product_variants?: RawVariant | null };

  const rawOrder = data as any;
  const rawItems = (rawOrder.order_items || []) as RawOrderItem[];

  const items: EnrichedOrderItem[] = rawItems.map((item) => {
    const variant = item.product_variants;
    // Handle products relation which might be object or array
    const product = Array.isArray(variant?.products)
      ? variant?.products[0]
      : variant?.products;

    const productImages = product?.product_images || [];
    const sortedProductImages = [...productImages].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Get image from variant images (sorted by display order), fallback to product image
    const variantImages = variant?.variant_images || [];
    const sortedVariantImages = [...variantImages].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const mainImage = sortedVariantImages[0]?.image_url || sortedProductImages[0]?.image_url;

    return {
      ...item,
      // Remove the nested object from the result to keep it clean
      product_variants: undefined,
      image_url: mainImage,
      color: variant?.color,
      size: variant?.size,
      product_id: product?.id,
      // We don't have slug in product table yet per types.ts, so we might skip it or use id
      // product_slug: product?.slug 
    };
  });

  return {
    ...rawOrder,
    items: items,
    status_history: rawOrder.order_status_history || [],
    payment: rawOrder.payments && rawOrder.payments.length > 0 ? rawOrder.payments[0] : null,
    shipping_address: rawOrder.addresses || (() => { console.warn('Addresses missing in order response', id); return null; })(),
  };
}

export async function createOrder(
  userId: string,
  orderData: CreateOrderRequest,
  shippingAmount: number = 0,
  idempotencyKey?: string,
  paymentMode: 'PREPAID' | 'COD' | 'PARTIAL_COD' = 'PREPAID'
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
    console.error('[ORDER REPO] RPC Error creating order:', errorMessage, rpcError);

    if (errorMessage.includes('Insufficient stock')) {
      throw new ConflictError(errorMessage);
    }
    if (errorMessage.includes('not found')) {
      throw new NotFoundError(errorMessage);
    }

    throw new Error(`Failed to create order: ${errorMessage}`);
  }

  if (!result) {
    console.error('[ORDER REPO] No result returned from create_order_transactional');
    throw new Error('Failed to create order: No result returned');
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

  let createdOrder = await findOrderById(orderResult.order_id);
  if (!createdOrder) {
    throw new Error('Failed to retrieve created order');
  }

  // Handle Promo Code
  if (orderData.promo_code || orderData.coupon_code) {
    const code = orderData.promo_code || orderData.coupon_code!;
    console.log('[ORDER REPO] Applying promo code:', code, 'to order:', createdOrder.id);

    try {
      // Import dynamically to avoid circular dependencies if any, or just standard import
      const { PromoService } = await import('@/services/promo');

      const { success, discountAmount } = await PromoService.applyPromoCode(
        code,
        createdOrder.id,
        userId,
        createdOrder.subtotal
      );

      if (success && discountAmount > 0) {
        console.log('[ORDER REPO] Promo code applied successfully. Discount:', discountAmount);

        // Recalculate totals
        // Tax rate should match the database function (0%)
        const taxableAmount = Math.max(0, createdOrder.subtotal - discountAmount);
        const newTax = 0; // Tax included in price
        const newTotal = taxableAmount + createdOrder.shipping + newTax;

        // Update Order
        const { error: updateError } = await db
          .from('orders')
          .update({
            discount: discountAmount,
            tax: newTax,
            total: newTotal
          } as any) // Cast as any because generated types might not have discount yet
          .eq('id', createdOrder.id);

        if (updateError) {
          console.error('[ORDER REPO] Error updating order with discount:', updateError);
          throw new Error(`Failed to update order with discount: ${updateError.message}`);
        }

        // Fetch updated order
        const updated = await findOrderById(createdOrder.id);
        if (updated) {
          createdOrder = updated;
          console.log('[ORDER REPO] Order updated with promo code successfully');
        }
      } else {
        console.log('[ORDER REPO] Promo code application returned success=false or zero discount');
      }
    } catch (error) {
      console.error('[ORDER REPO] Failed to apply promo code during order creation:', error);
      console.error('[ORDER REPO] Error details:', error instanceof Error ? error.message : String(error));

      // Rollback: Delete the order since promo code application failed
      // The user expects the discount, so we should fail the entire order creation
      try {
        console.log('[ORDER REPO] Rolling back order creation due to promo code failure');
        const { error: deleteError } = await db.from('orders').delete().eq('id', createdOrder.id);
        if (deleteError) {
          console.error('[ORDER REPO] Failed to rollback order:', deleteError);
        }
      } catch (rollbackError) {
        console.error('[ORDER REPO] Exception during rollback:', rollbackError);
      }

      // Re-throw the original error with more context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error applying promo code';
      throw new Error(`Failed to apply promo code "${code}": ${errorMessage}`);
    }
  }

  // Handle Partial COD
  if (paymentMode === 'PARTIAL_COD') {
    const advanceAmount = 70; // Fixed advance amount
    const totalAmount = createdOrder.total;
    const remainingBalance = Math.max(0, totalAmount - advanceAmount);

    console.log('[ORDER REPO] Setting up Partial COD for order:', createdOrder.id);

    const { error: updateError } = await db
      .from('orders')
      .update({
        payment_mode: 'PARTIAL_COD',
        advance_payment_amount: advanceAmount,
        remaining_balance: remainingBalance,
        is_partial_payment: true
      } as any)
      .eq('id', createdOrder.id);

    if (updateError) {
      console.error('[ORDER REPO] Error updating order with partial COD details:', updateError);
    } else {
      // Fetch updated order with new fields
      const updated = await findOrderById(createdOrder.id);
      if (updated) {
        createdOrder = updated;
      }
    }
  } else if (paymentMode === 'COD') {
    // Just mark as COD
    await db.from('orders').update({ payment_mode: 'COD' } as any).eq('id', createdOrder.id);
    createdOrder.payment_mode = 'COD';
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
    discount: Number(order.discount ?? 0),
    tax: Number(order.tax ?? 0),
    total: Number(order.total ?? 0),
    paymentMode: String(order.payment_mode || 'PREPAID'),
    advancePayment: Number(order.advance_payment_amount ?? 0),
    remainingBalance: Number(order.remaining_balance ?? 0),
    isPartialPayment: Boolean(order.is_partial_payment ?? false),
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

